import {toast } from "sonner";


export interface FormFields {
  [key: string]: string | number | Date | string[]  | undefined;
}

export function validateForm(
  fields: FormFields,
  requiredFields: string[] = []
): boolean {
  const nameRegex = /^[A-Za-z\s'-]+$/;
  const usernameRegex = /^[A-Za-z0-9_.-](?:[A-Za-z0-9_.-\s]*[A-Za-z0-9_.-])?$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
  const phoneRegex = /^\+?[0-9](?:[0-9 ]{7,14})$/;
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  const locationRegex = /^[\p{L}0-9\s,'-]{2,100}$/u


  for (const field of requiredFields) {
    const value = fields[field];

    if (value === undefined || value === null) {
      toast.error(`${getFrWord(field)} manquant`);
      return false;
    }

    if (typeof value === "string" && value.trim() === "") {
      toast.error(`${getFrWord(field)} manquant`);
      return false;
    }

    if (Array.isArray(value) && value.length === 0) {
      toast.error(`${getFrWord(field)} manquant`);
      return false;
    }

    if (value instanceof Date && isNaN(value.getTime())) {
      toast.error(`${getFrWord(field)} manquant`);
      return false;
    }
  }

  for (const [key, rawValue] of Object.entries(fields)) {
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (!requiredFields.includes(key) && !value) {
      continue;
    }

    if (typeof value !== "string") continue;

    switch (key) {

      case "username":
      case "name":
        if (!usernameRegex.test(value))
          return error(
            `${capitalize(getFrWord(key))} invalide`,
            `${capitalize(getFrWord(key))} doit contenir entre 3 et 20 caractères (lettres, chiffres, points, tirets ou underscores).`
          );
        break;
      case "identifier":
        if (!emailRegex.test(value) && !usernameRegex.test(value))
          return error(
            "Entrée invalide",
            "Veuillez saisir un email ou un nom d'utilisateur valide."
          );
        break;
      case "firstName":
      case "lastName":
        if (!nameRegex.test(value))
          return error(
            `${capitalize(getFrWord(key))} invalide`,
            `${capitalize(getFrWord(key))} ne doit contenir que des lettres.`
          );
        break;
      case "email":
        if (!emailRegex.test(value))
          return error("Email invalide", "Veuillez saisir une adresse email valide.");
        break;
      case "phoneNumber":
        if (!phoneRegex.test(value))
          return error(
            "Numéro de téléphone invalide",
            "Le numéro de téléphone doit contenir entre 8 et 15 chiffres (optionnellement commençant par +)."
          );
        break;
      case "password":
        if (!passwordRegex.test(value))
          return error(
            "Mot de passe faible",
            "Le mot de passe doit contenir au moins 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial."
          );
        break;
      case "confirmPassword":
        if (value !== fields.password)
          return error(
            "Les mots de passe ne correspondent pas",
            "Veuillez vous assurer que les mots de passe correspondent."
          );
        break;
      case "website":
        if (value && !urlRegex.test(value))
          return error(
            `URL ${capitalize(getFrWord(key))} invalide`,
            `Veuillez saisir une URL valide pour ${getFrWord(key)}.`
          );
        break;
  
      case "description":
        if (value.length < 20)
          return error(
            `${capitalize(getFrWord(key))} invalide`,
            `${capitalize(getFrWord(key))} doit contenir au moins 20 caractères.`
          );
        break;
      case "location":
        if (!locationRegex.test(value))
          return error(
            "Localisation invalide",
            "La localisation doit contenir entre 2 et 100 caractères et ne pas inclure de caractères spéciaux."
          );
        break;
      default:
        break;
    }
  }

  return true;
}

function capitalize(str: string): string {
  if (!str) return "";
  const spaced = str.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function error(title: string, text: string) {
  toast.error(title, { description: text });
  return false;
}


function getFrWord(key: string): string {
  switch (key) {
    case "username":
      return "nom d'utilisateur";
    case "name":
      return "nom";
    case "firstName":
      return "prénom";
    case "lastName":
      return "nom ";
    case "website":
      return "site web";
    case "passwordsignin":
      return "mot de passe";
    default:
    
      return key;
  }
    
}