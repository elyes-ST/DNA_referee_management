import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import {
  Referee,
  RefereeDocument,
} from '../../referees/schemas/referee.schema';
import PDFDocument from 'pdfkit';

interface RegionalPDFOptions {
  region: string;
  startDate: string; // ISO date: YYYY-MM-DD
  endDate: string;   // ISO date: YYYY-MM-DD
  category?: string;
  presidentName?: string;
  presidentSignature?: string;
  label?: string;    // Human-readable period, e.g. "Janvier 2026"
}

@Injectable()
export class RegionalPDFService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Referee.name) private refereeModel: Model<RefereeDocument>,
  ) { }

  /**
   * Generate regional PDF for payment distribution.
   * Queries validated payments by startDate/endDate date range instead of month/saison.
   */
  async generateRegionalPDF(options: RegionalPDFOptions): Promise<Buffer> {
    const {
      region,
      startDate,
      endDate,
      category,
      presidentName,
      label,
    } = options;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const query: any = {
      region,
      startDate: { $gte: start },
      endDate: { $lte: end },
      status: 'VALIDATED',
    };

    if (category) {
      query.category = category;
    }

    const payments = await this.paymentModel
      .find(query)
      .populate('refereeId', 'firstName lastName category licenseNumber')
      .sort({ category: 1, 'refereeId.lastName': 1 })
      .exec();

    if (payments.length === 0) {
      throw new NotFoundException(
        'No validated payments found for the specified criteria',
      );
    }

    const periodLabel =
      label ||
      `${start.toLocaleDateString('fr-FR')} → ${end.toLocaleDateString('fr-FR')}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('ÉTAT DE PAIEMENT DES ARBITRES', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Région: ${region}`, { align: 'center' });
      doc.text(`Période: ${periodLabel}`, { align: 'center' });
      if (category) {
        doc.text(`Catégorie: ${category}`, { align: 'center' });
      }
      doc.moveDown(1);

      // Summary
      const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalReferees = new Set(payments.map((p) => p.refereeId.toString()))
        .size;

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`Total Arbitres: ${totalReferees}`);
      doc.text(
        `Total Matchs: ${payments.reduce((sum, p) => sum + p.totalMatches, 0)}`,
      );
      doc.text(`Montant Total: ${totalAmount.toLocaleString('fr-FR')} TND`, {
        continued: false,
      });
      doc.moveDown(1);

      // Table header
      const tableTop = doc.y;
      const colWidths = [30, 120, 70, 50, 60, 70];
      const headers = ['N°', 'Nom & Prénom', 'Licence', 'Cat.', 'Matchs', 'Montant'];

      doc.fontSize(10).font('Helvetica-Bold');
      let xPos = 50;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop, {
          width: colWidths[i],
          align: i === 0 ? 'center' : 'left',
        });
        xPos += colWidths[i];
      });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.fontSize(9).font('Helvetica');
      let rowNumber = 1;
      let yPos = tableTop + 25;

      payments.forEach((payment) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        const referee = payment.refereeId as any;
        const fullName = `${referee.lastName} ${referee.firstName}`;

        xPos = 50;
        doc.text(rowNumber.toString(), xPos, yPos, {
          width: colWidths[0],
          align: 'center',
        });
        xPos += colWidths[0];
        doc.text(fullName, xPos, yPos, { width: colWidths[1] });
        xPos += colWidths[1];
        doc.text(referee.licenseNumber || 'N/A', xPos, yPos, {
          width: colWidths[2],
        });
        xPos += colWidths[2];
        doc.text(payment.category, xPos, yPos, { width: colWidths[3] });
        xPos += colWidths[3];
        doc.text(payment.totalMatches.toString(), xPos, yPos, {
          width: colWidths[4],
          align: 'center',
        });
        xPos += colWidths[4];
        doc.text(payment.totalAmount.toLocaleString('fr-FR'), xPos, yPos, {
          width: colWidths[5],
          align: 'right',
        });

        yPos += 20;
        rowNumber++;
      });

      // Total line
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('TOTAL GÉNÉRAL:', 300, yPos);
      doc.text(`${totalAmount.toLocaleString('fr-FR')} TND`, 420, yPos, {
        align: 'right',
      });

      // Signature section
      yPos += 40;
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(11).font('Helvetica');
      doc.text('Établi par:', 50, yPos);
      doc.text('Validé par le Président CRA:', 350, yPos);

      yPos += 80;
      doc.moveTo(50, yPos).lineTo(200, yPos).stroke();
      doc.moveTo(350, yPos).lineTo(500, yPos).stroke();

      yPos += 5;
      doc.fontSize(9).font('Helvetica-Oblique');
      doc.text('Signature et cachet', 50, yPos);
      if (presidentName) {
        doc.text(presidentName, 350, yPos);
      } else {
        doc.text('Nom et signature', 350, yPos);
      }

      // Footer
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
          50,
          750,
          { align: 'center' },
        );

      doc.end();
    });
  }

  /**
   * Generate consolidated PDF for all categories in a region (date-range based).
   */
  async generateConsolidatedRegionalPDF(
    region: string,
    startDate: string,
    endDate: string,
    presidentName?: string,
    label?: string,
  ): Promise<Buffer> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const categories = ['A', 'B', 'C'];
    const categoryPDFs: any[] = [];

    for (const category of categories) {
      const payments = await this.paymentModel
        .find({
          region,
          startDate: { $gte: start },
          endDate: { $lte: end },
          category,
          status: 'VALIDATED',
        })
        .populate('refereeId', 'firstName lastName category licenseNumber')
        .sort({ 'refereeId.lastName': 1 })
        .exec();

      if (payments.length > 0) {
        categoryPDFs.push({
          category,
          payments,
          totalAmount: payments.reduce((sum, p) => sum + p.totalAmount, 0),
          totalReferees: payments.length,
        });
      }
    }

    if (categoryPDFs.length === 0) {
      throw new NotFoundException(
        'No validated payments found for any category',
      );
    }

    const periodLabel =
      label ||
      `${start.toLocaleDateString('fr-FR')} → ${end.toLocaleDateString('fr-FR')}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cover page
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('RAPPORT CONSOLIDÉ', { align: 'center' });
      doc.fontSize(18).text('PAIEMENTS DES ARBITRES', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica');
      doc.text(`Région: ${region}`, { align: 'center' });
      doc.text(`Période: ${periodLabel}`, { align: 'center' });
      doc.moveDown(2);

      // Summary by category
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('RÉSUMÉ PAR CATÉGORIE:', { align: 'left' });
      doc.moveDown(0.5);

      const grandTotal = categoryPDFs.reduce(
        (sum, cat) => sum + cat.totalAmount,
        0,
      );
      const grandTotalReferees = categoryPDFs.reduce(
        (sum, cat) => sum + cat.totalReferees,
        0,
      );

      categoryPDFs.forEach((cat) => {
        doc.fontSize(11).font('Helvetica');
        doc.text(
          `Catégorie ${cat.category}: ${cat.totalReferees} arbitres - ${cat.totalAmount.toLocaleString('fr-FR')} TND`,
        );
      });

      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(
        `TOTAL GÉNÉRAL: ${grandTotalReferees} arbitres - ${grandTotal.toLocaleString('fr-FR')} TND`,
      );

      // Add each category detail on separate pages
      categoryPDFs.forEach((catData) => {
        doc.addPage();
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(`CATÉGORIE ${catData.category}`, { align: 'center' });
        doc.moveDown(1);

        const tableTop = doc.y;
        const colWidths = [30, 150, 80, 60, 80];
        const headers = ['N°', 'Nom & Prénom', 'Licence', 'Matchs', 'Montant'];

        doc.fontSize(10).font('Helvetica-Bold');
        let xPos = 50;
        headers.forEach((header, i) => {
          doc.text(header, xPos, tableTop, {
            width: colWidths[i],
            align: i === 0 ? 'center' : 'left',
          });
          xPos += colWidths[i];
        });

        doc
          .moveTo(50, tableTop + 15)
          .lineTo(500, tableTop + 15)
          .stroke();

        let yPos = tableTop + 25;
        let rowNumber = 1;

        doc.fontSize(9).font('Helvetica');
        catData.payments.forEach((payment: any) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          const referee = payment.refereeId;
          xPos = 50;
          doc.text(rowNumber.toString(), xPos, yPos, {
            width: colWidths[0],
            align: 'center',
          });
          xPos += colWidths[0];
          doc.text(`${referee.lastName} ${referee.firstName}`, xPos, yPos, {
            width: colWidths[1],
          });
          xPos += colWidths[1];
          doc.text(referee.licenseNumber || 'N/A', xPos, yPos, {
            width: colWidths[2],
          });
          xPos += colWidths[2];
          doc.text(payment.totalMatches.toString(), xPos, yPos, {
            width: colWidths[3],
            align: 'center',
          });
          xPos += colWidths[3];
          doc.text(payment.totalAmount.toLocaleString('fr-FR'), xPos, yPos, {
            width: colWidths[4],
            align: 'right',
          });

          yPos += 20;
          rowNumber++;
        });

        // Category total
        doc.moveTo(50, yPos).lineTo(500, yPos).stroke();
        yPos += 10;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('TOTAL CATÉGORIE:', 280, yPos);
        doc.text(
          `${catData.totalAmount.toLocaleString('fr-FR')} TND`,
          380,
          yPos,
          { align: 'right' },
        );
      });

      // Final signature page
      doc.addPage();
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('SIGNATURES ET VALIDATION', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(11).font('Helvetica');
      doc.text('Établi par:', 50, 200);
      doc.text('Validé par le Président CRA:', 350, 200);

      doc.moveTo(50, 280).lineTo(200, 280).stroke();
      doc.moveTo(350, 280).lineTo(500, 280).stroke();

      doc.fontSize(9).font('Helvetica-Oblique');
      doc.text('Signature et cachet', 50, 285);
      if (presidentName) {
        doc.text(presidentName, 350, 285);
      } else {
        doc.text('Nom et signature', 350, 285);
      }

      doc
        .fontSize(8)
        .text(
          `Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
          50,
          750,
          { align: 'center' },
        );

      doc.end();
    });
  }

  /**
   * Get regions that have validated payments within a date range.
   */
  async getRegionsWithValidatedPayments(
    startDate: string,
    endDate: string,
  ): Promise<string[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const regions = await this.paymentModel
      .find({
        startDate: { $gte: start },
        endDate: { $lte: end },
        status: 'VALIDATED',
      })
      .distinct('region');

    return regions;
  }
}
