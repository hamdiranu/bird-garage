import Garage from "@/components/garage/Garage";
import { I18nProvider } from "@/i18n/I18nProvider";

export default function Home() {
  return (
    <I18nProvider>
      <Garage />
    </I18nProvider>
  );
}
