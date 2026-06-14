import { createClient } from "@/lib/supabase/server";

export type AppSettings = {
  company_name: string;
  company_address: string;
  matricule_fiscal: string;
  email: string;
  phone: string;
  website: string;
  tva_rate: number;
  default_devis_object: string;
  default_facture_object: string;
  bank_name: string | null;
  bank_iban: string | null;
  bank_rib: string | null;
  payment_terms: string | null;
};

const FALLBACK: AppSettings = {
  company_name: "Next Level",
  company_address: "",
  matricule_fiscal: "",
  email: "contact@nextlevel.studio",
  phone: "",
  website: "nextlevel.studio",
  tva_rate: 19,
  default_devis_object:
    "Création d'identité visuelle et supports de communication",
  default_facture_object: "Facturation services rendus",
  bank_name: null,
  bank_iban: null,
  bank_rib: null,
  payment_terms: null,
};

/** Server-only. Reads the singleton settings row, with a safe fallback. */
export async function getSettings(): Promise<AppSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select(
        "company_name, company_address, matricule_fiscal, email, phone, website, tva_rate, default_devis_object, default_facture_object, bank_name, bank_iban, bank_rib, payment_terms",
      )
      .eq("id", 1)
      .maybeSingle();
    if (!data) return FALLBACK;
    return {
      ...FALLBACK,
      ...data,
      tva_rate: Number(data.tva_rate ?? FALLBACK.tva_rate),
    };
  } catch (err) {
    console.error("[settings] read failed", err);
    return FALLBACK;
  }
}
