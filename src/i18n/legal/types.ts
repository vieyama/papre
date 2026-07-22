export interface LegalListItem {
  term: string;
  description: string;
}

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: LegalListItem[];
  listFootnote?: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  contactPrefix: string;
}

export interface LegalContent {
  backToPapre: string;
  lastUpdatedLabel: string;
  privacy: LegalDocument;
  terms: LegalDocument;
}
