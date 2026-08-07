import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '../deals/entities/deal.entity';
import { Organization } from '../organizations/entities/organization.entity';

export interface ContractTemplate {
  id: string;
  name: string;
  version: string;
  applicableCountries: string[]; // origin -> destination pairs
  applicableCategories: string[];
  templateBody: string; // Markdown with {{variable}} placeholders
}

export interface GeneratedContract {
  dealId: string;
  contractNumber: string;
  renderedContent: string;
  variables: Record<string, string>;
  generatedAt: Date;
  generatedBy: string;
  templateVersion: string;
}

export interface ContractAcceptance {
  contractId: string;
  organizationId: string;
  acceptedByUserId: string;
  acceptedAt: Date;
  signatureMethod: 'clickwrap' | 'docusign' | 'manual_upload';
  signatureDocumentId?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
  ) {}

  /**
   * Generate a trade contract from deal data.
   * Uses a template-based approach with variable substitution.
   */
  async generateContract(dealId: string, generatedByUserId: string): Promise<GeneratedContract> {
    const deal = await this.dealRepo.findOne({
      where: { id: dealId,  },
      relations: ['buyer', 'supplier', 'productCategory'],
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const contractNumber = this.generateContractNumber(deal);
    const template = this.selectTemplate(deal);
    const variables = await this.extractVariables(deal);
    const renderedContent = this.renderTemplate(template, variables);

    this.logger.log(`Generated contract ${contractNumber} for deal ${dealId}`);

    return {
      dealId,
      contractNumber,
      renderedContent,
      variables,
      generatedAt: new Date(),
      generatedBy: generatedByUserId,
      templateVersion: template.version,
    };
  }

  /**
   * Record contract acceptance by a party.
   * Does not modify deal status — that is handled by the deal workflow.
   */
  async recordAcceptance(acceptance: ContractAcceptance): Promise<void> {
    this.logger.log(
      `Contract acceptance recorded: ${acceptance.contractId} by org ${acceptance.organizationId} via ${acceptance.signatureMethod}`,
    );
    // In production, this would persist to a contract_acceptances table
    // For now, logged and returned for the caller to store
  }

  private generateContractNumber(deal: Deal): string {
    const date = new Date();
    const prefix = 'AATOS';
    const year = date.getFullYear();
    const sequence = deal.id.slice(0, 8).toUpperCase();
    return `${prefix}-${year}-${sequence}`;
  }

  private selectTemplate(_deal: Deal): ContractTemplate {
    // In production, templates would be fetched from a database
    // Default template for green coffee Kenya -> US
    return {
      id: 'default-coffee-export',
      name: 'Green Coffee Export Contract',
      version: '1.0.0',
      applicableCountries: ['KE->US'],
      applicableCategories: ['coffee'],
      templateBody: this.getDefaultTemplate(),
    };
  }

  private async extractVariables(deal: Deal): Promise<Record<string, string>> {
    const buyer = deal.buyer as Organization;
    const supplier = deal.supplier as Organization;

    return {
      contractNumber: this.generateContractNumber(deal),
      dealTitle: deal.title,
      dealDescription: deal.description || '',
      buyerName: buyer?.name || 'Buyer',
      buyerLegalName: buyer?.legalName || buyer?.name || 'Buyer',
      buyerCountry: buyer?.countryCode || '',
      buyerAddress: buyer?.address || '',
      supplierName: supplier?.name || 'Supplier',
      supplierLegalName: supplier?.legalName || supplier?.name || 'Supplier',
      supplierCountry: supplier?.countryCode || '',
      supplierAddress: supplier?.address || '',
      productCategory: deal.productCategoryId || 'Product',
      agreedQuantity: deal.agreedQuantity.toString(),
      quantityUnit: deal.quantityUnit,
      agreedPrice: deal.agreedPrice.toString(),
      priceCurrency: deal.priceCurrency,
      incoterm: deal.incoterm,
      paymentTerms: deal.paymentTerms || 'Net 30',
      deliveryDate: deal.deliveryDate?.toISOString().split('T')[0] || 'TBD',
      totalValue: (deal.agreedQuantity * deal.agreedPrice).toFixed(2),
      platformFee: (deal.platformFeeUsd || 0).toFixed(2),
      governingLaw: 'Laws of the State of Delaware, United States',
      jurisdiction: 'Delaware, United States',
      generatedAt: new Date().toISOString(),
    };
  }

  private renderTemplate(template: ContractTemplate, variables: Record<string, string>): string {
    let rendered = template.templateBody;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
    }
    return rendered;
  }

  private getDefaultTemplate(): string {
    return `# INTERNATIONAL SALE OF GOODS CONTRACT

**Contract Number:** {{contractNumber}}
**Date:** {{generatedAt}}

---

## PARTIES

**Seller (Exporter):**
{{supplierLegalName}}
{{supplierAddress}}
{{supplierCountry}}

**Buyer (Importer):**
{{buyerLegalName}}
{{buyerAddress}}
{{buyerCountry}}

---

## PRODUCT

{{productCategory}}

Quantity: {{agreedQuantity}} {{quantityUnit}}
Price: {{agreedPrice}} {{priceCurrency}} per {{quantityUnit}}
Total Value: {{totalValue}} {{priceCurrency}}

---

## TERMS

**Incoterm:** {{incoterm}}
**Payment Terms:** {{paymentTerms}}
**Delivery Date:** {{deliveryDate}}

---

## GOVERNING LAW

This contract shall be governed by {{governingLaw}}.
Disputes shall be resolved in {{jurisdiction}}.

---

*This contract was generated by AATOS and is binding upon signature by both parties.*
`;
  }
}
