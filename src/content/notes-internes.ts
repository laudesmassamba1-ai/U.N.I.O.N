export const showDraftNotes = (): boolean => {
  return typeof import.meta !== 'undefined' && import.meta.env?.VITE_DRAFT_NOTES === 'true';
};

export const internalNotes = {
  home: {
    approvalTip: "Conseil au bureau : activez l'approbation des nouveaux participants dans WhatsApp.",
    statusNote: "Dossier légal et structuration en cours de validation par les fondateurs.",
  },
  union: {
    foundersTip: "Valeurs et orientations soumises à la validation des fondateurs.",
  },
  charter: {
    quotas: "Valeur chiffrée à fixer par les fondateurs (ex. un tiers au moins de femmes et de jeunes).",
    pactePotoPoto: "Nom du pacte à confirmer avec les fondateurs.",
  },
  bureau: {
    zonesNote: "La liste des zones de mobilisation sera publiée avec le Bureau.",
    positionsNote: "Les postes sont pourvus au fur et à mesure.",
  },
  rejoindre: {
    whatsappTip: "Activer la modération des arrivants dans les paramètres du groupe.",
  },
  documents: {
    legalStatus: "Dossier de déclaration en préparation.",
  },
} as const;
