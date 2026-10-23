import { DateField, FieldGrid, TextField } from "./fields";

/**
 * « Fait à / Le / Signature » des fiches. Aucun service de signature externe :
 * le signataire saisit son nom ; la signature manuscrite et le cachet seront
 * apposés sur le document final.
 */
export function SignatureFields({ signatureLabel }: { signatureLabel: string }) {
  return (
    <FieldGrid className="lg:grid-cols-3">
      <TextField name="signature.place" label="Fait à" autoComplete="address-level2" />
      <DateField name="signature.date" label="Le" />
      <TextField
        name="signature.signature"
        label={signatureLabel}
        hint="Saisissez vos nom et prénom. La signature et le cachet seront apposés sur le document final."
        autoComplete="name"
      />
    </FieldGrid>
  );
}
