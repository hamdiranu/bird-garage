// Finishes scanned car models for the garage, in place:
//
//   npm run finish-scan -- public/models/<service>/<car>.glb [more.glb …]
//
// Run it after `gltf-transform optimize` (see "Add a scanned car" in the README). It
//   1. strips what the garage never draws: scans are shown unlit, exactly as their colour texture, so the normal,
//      metal/roughness and occlusion maps and the vertex normals are dead weight. The file is marked unlit
//      (KHR_materials_unlit) so other viewers show it the same way;
//   2. re-encodes the colour texture as KTX2 (Basis Universal ETC1S, with mipmaps). The browser transcodes it into
//      whatever compressed format the GPU reads, so a 2048 px texture takes about 2.7 MB of GPU memory instead of
//      22 MB, and uploads without decoding.
// The file is written back with the Meshopt geometry compression it came in with. Running it twice is harmless.

import { statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRMaterialsUnlit } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";
import { ktx2 } from "ktx2-encoder/gltf-transform";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: npm run finish-scan -- <model.glb> [more.glb …]");
  process.exit(1);
}

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

/** Material extensions that only matter to lit rendering. */
const LIT_ONLY = ["KHR_materials_specular", "KHR_materials_volume", "KHR_materials_clearcoat", "KHR_materials_sheen", "KHR_materials_ior", "KHR_materials_transmission"];

/** Texture encoding: ETC1S at its best quality, which on these atlases is hard to tell from the WebP original. */
const KTX2 = {
  isUASTC: false,
  qualityLevel: 255,
  compressionLevel: 2,
  generateMipmap: true,
  imageDecoder: async (buffer) => {
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), width: info.width, height: info.height };
  },
};

for (const file of files) {
  const before = statSync(file).size;
  const doc = await io.read(file);
  const root = doc.getRoot();
  const unlit = doc.createExtension(KHRMaterialsUnlit).createUnlit();

  for (const material of root.listMaterials()) {
    material.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null);
    for (const name of LIT_ONLY) material.setExtension(name, null);
    material.setExtension("KHR_materials_unlit", unlit);
  }
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) prim.setAttribute("NORMAL", null).setAttribute("TANGENT", null);
  }
  await doc.transform(prune(), ktx2(KTX2));

  // drop extensions nothing uses any more (the WebP textures are gone)
  const webpLeft = root.listTextures().some((t) => t.getMimeType() === "image/webp");
  for (const ext of root.listExtensionsUsed()) {
    if (LIT_ONLY.includes(ext.extensionName) || (ext.extensionName === "EXT_texture_webp" && !webpLeft)) ext.dispose();
  }

  await io.write(file, doc);
  const after = statSync(file).size;
  console.log(`${file}: ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB`);
}
