import { Injectable, Logger } from '@nestjs/common';

export interface DocumentTemplate {
  id: string;
  name: string;
  category: 'compliance' | 'contract' | 'shipping' | 'customs' | 'insurance';
  jurisdiction: string;
  applicableProductTypes: string[];
  required: boolean;
  content: string;
  variables: string[];
  version: string;
  lastUpdated: Date;
}

/**
 * Compliance Document Templates Service
 * Provides standardized document templates for trade compliance.
 */
@Injectable()
export class DocumentTemplatesService {
  private readonly logger = new Logger(DocumentTemplatesService.name);
  private readonly templates: Map<string, DocumentTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  async getTemplate(id: string): Promise<DocumentTemplate | undefined> {
    return this.templates.get(id);
  }

  async getTemplatesByCategory(category: DocumentTemplate['category']): Promise<DocumentTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  async getTemplatesByJurisdiction(jurisdiction: string): Promise<DocumentTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.jurisdiction === jurisdiction);
  }

  async getRequiredTemplates(productType: string, jurisdiction: string): Promise<DocumentTemplate[]> {
    return Array.from(this.templates.values()).filter(
      t => t.required &&
           t.jurisdiction === jurisdiction &&
           (t.applicableProductTypes.length === 0 || t.applicableProductTypes.includes(productType)),
    );
  }

  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    let rendered = template.content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return rendered;
  }

  async listAllTemplates(): Promise<DocumentTemplate[]> {
    return Array.from(this.templates.values());
  }

  private initializeTemplates(): void {
    const templates: DocumentTemplate[] = [
      {
        id: 'phytosanitary-certificate',
        name: 'Phytosanitary Certificate (KE→US)',
        category: 'compliance',
        jurisdiction: 'KE',
        applicableProductTypes: ['green_coffee', 'nuts', 'spices'],
        required: true,
        content: `PHYTOSANITARY CERTIFICATE

Consignor: {{exporterName}}
Address: {{exporterAddress}}

Consignee: {{importerName}}
Address: {{importerAddress}}

Place of Origin: {{origin}}
Point of Entry: {{destination}}

Description of Consignment:
Product: {{productName}}
Variety: {{variety}}
Quantity: {{quantity}} {{unit}}
Packaging: {{packagingType}}

This is to certify that the plants, plant products or other regulated articles described herein have been inspected and/or tested according to appropriate official procedures and are considered to be free from quarantine pests and practically free from other injurious pests; and that they are considered to conform with the current phytosanitary regulations of the importing country.

Date of Issue: {{issueDate}}
Valid Until: {{expiryDate}}

Issuing Authority: Kenya Plant Health Inspectorate Service (KEPHIS)
Certificate No: {{certificateNumber}}

Signature: _________________________
Official Stamp:`,
        variables: ['exporterName', 'exporterAddress', 'importerName', 'importerAddress', 'origin', 'destination', 'productName', 'variety', 'quantity', 'unit', 'packagingType', 'issueDate', 'expiryDate', 'certificateNumber'],
        version: '1.0',
        lastUpdated: new Date('2026-01-15'),
      },
      {
        id: 'export-declaration',
        name: 'Export Declaration (KE)',
        category: 'customs',
        jurisdiction: 'KE',
        applicableProductTypes: [],
        required: true,
        content: `EXPORT DECLARATION

Exporter: {{exporterName}}
PIN: {{exporterPin}}

Commodity: {{commodity}}
HS Code: {{hsCode}}
Value: {{value}} {{currency}}
Destination: {{destinationCountry}}

I declare that the information provided is true and correct.

Date: {{declarationDate}}
Signature: _________________________`,
        variables: ['exporterName', 'exporterPin', 'commodity', 'hsCode', 'value', 'currency', 'destinationCountry', 'declarationDate'],
        version: '1.0',
        lastUpdated: new Date('2026-01-15'),
      },
      {
        id: 'organic-cert-template',
        name: 'Organic Certification Reference',
        category: 'compliance',
        jurisdiction: 'US',
        applicableProductTypes: ['green_coffee', 'nuts'],
        required: false,
        content: `ORGANIC CERTIFICATION VERIFICATION

Certification Body: {{certBody}}
License Number: {{licenseNumber}}
Operator: {{operatorName}}
Products: {{products}}

This certificate confirms that the above-named operator has been inspected and evaluated in accordance with the USDA National Organic Program regulations (7 CFR Part 205).

Valid From: {{validFrom}}
Valid Until: {{validUntil}}

Certification Body Seal:`,
        variables: ['certBody', 'licenseNumber', 'operatorName', 'products', 'validFrom', 'validUntil'],
        version: '1.0',
        lastUpdated: new Date('2026-01-15'),
      },
      {
        id: 'commercial-invoice',
        name: 'Commercial Invoice',
        category: 'customs',
        jurisdiction: 'KE',
        applicableProductTypes: [],
        required: true,
        content: `COMMERCIAL INVOICE

Invoice No: {{invoiceNumber}}
Date: {{invoiceDate}}

Seller:
{{sellerName}}
{{sellerAddress}}

Buyer:
{{buyerName}}
{{buyerAddress}}

Description of Goods:
{{productDescription}}
Quantity: {{quantity}} {{unit}}
Unit Price: {{unitPrice}} {{currency}}
Total Amount: {{totalAmount}} {{currency}}

Payment Terms: {{paymentTerms}}
Delivery Terms: {{deliveryTerms}}

Bank Details:
Bank: {{bankName}}
Account: {{accountNumber}}
SWIFT: {{swiftCode}}

Authorized Signature: _________________________`,
        variables: ['invoiceNumber', 'invoiceDate', 'sellerName', 'sellerAddress', 'buyerName', 'buyerAddress', 'productDescription', 'quantity', 'unit', 'unitPrice', 'currency', 'totalAmount', 'paymentTerms', 'deliveryTerms', 'bankName', 'accountNumber', 'swiftCode'],
        version: '1.0',
        lastUpdated: new Date('2026-01-15'),
      },
      {
        id: 'certificate-of-origin',
        name: 'Certificate of Origin (EAC-EU EPA)',
        category: 'compliance',
        jurisdiction: 'KE',
        applicableProductTypes: ['green_coffee', 'nuts', 'spices'],
        required: true,
        content: `CERTIFICATE OF ORIGIN

EAST AFRICAN COMMUNITY — EUROPEAN UNION ECONOMIC PARTNERSHIP AGREEMENT

Exporter: {{exporterName}}
Exporter PIN: {{exporterPin}}
Country: Kenya

Product Description: {{productDescription}}
HS Code: {{hsCode}}
Quantity: {{quantity}} {{unit}}
Invoice Value: {{invoiceValue}} {{currency}}
Invoice Number: {{invoiceNumber}}

Cumulation Applied: {{cumulationStatus}}

I, the undersigned, declare that the goods described above originate in Kenya and comply with the origin requirements specified for those goods in the EAC-EU EPA.

Date: {{issueDate}}
Place: {{issuePlace}}

Signature: _________________________
Official Stamp:`,
        variables: ['exporterName', 'exporterPin', 'productDescription', 'hsCode', 'quantity', 'unit', 'invoiceValue', 'currency', 'invoiceNumber', 'cumulationStatus', 'issueDate', 'issuePlace'],
        version: '1.0',
        lastUpdated: new Date('2026-01-15'),
      },
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }
}
