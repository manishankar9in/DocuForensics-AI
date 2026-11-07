import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)

class DossierService:
    def generate_pdf(
        self,
        investigation: Dict[str, Any],
        documents: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        comparisons: List[Any]
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Forensic Styles
        title_style = ParagraphStyle(
            'ForensicTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#172033')
        )
        subtitle_style = ParagraphStyle(
            'ForensicSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#667085')
        )
        section_style = ParagraphStyle(
            'ForensicSection',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=colors.HexColor('#334E8C'),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ForensicBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#172033')
        )
        mono_style = ParagraphStyle(
            'ForensicMono',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#334E8C')
        )

        story = []

        # 1. Header & Title Block
        story.append(Paragraph("DOCUFORENSICS AI — INVESTIGATION DOSSIER", subtitle_style))
        story.append(Paragraph(investigation.get("title", "Forensic Investigation Report"), title_style))
        story.append(Spacer(1, 4))
        
        case_ref = investigation.get("case_ref") or "UNASSIGNED"
        gen_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        story.append(Paragraph(f"<b>Case Ref:</b> {case_ref} &nbsp;|&nbsp; <b>Generated:</b> {gen_time} &nbsp;|&nbsp; <b>Status:</b> {investigation.get('status', '').upper()}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#334E8C'), spaceBefore=8, spaceAfter=14))

        # 2. Executive Summary Box
        stats = investigation.get("stats", {})
        crit = stats.get("critical_findings", 0)
        warn = stats.get("warning_findings", 0)
        tot_docs = len(documents)
        tot_findings = len(findings)

        summary_data = [
            ["Analyzed Documents", "Total Inconsistencies", "Critical Discrepancies", "Warnings / Anomalies"],
            [str(tot_docs), str(tot_findings), str(crit), str(warn)]
        ]
        t_summary = Table(summary_data, colWidths=[135, 135, 135, 135])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8EEF9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#334E8C')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E3E8EF')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FFFFFF')),
            ('FONTSIZE', (0, 1), (-1, 1), 14),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ]))
        story.append(t_summary)
        story.append(Spacer(1, 14))

        # 3. Document Inventory & Cryptographic Hashes
        story.append(Paragraph("1. DOCUMENT EVIDENCE MANIFEST", section_style))
        doc_table_data = [["Filename", "Type", "Pages", "File Size", "SHA-256 Cryptographic Hash"]]
        for d in documents:
            size_kb = f"{d.get('file_size', 0) / 1024:.1f} KB"
            sha_abbr = d.get('sha256_hash', '')[:24] + "..."
            doc_table_data.append([
                Paragraph(d.get("original_filename", ""), body_style),
                d.get("classification", {}).get("predicted_type", "unknown").upper(),
                str(d.get("page_count", 1)),
                size_kb,
                Paragraph(sha_abbr, mono_style)
            ])

        t_docs = Table(doc_table_data, colWidths=[140, 80, 45, 65, 210])
        t_docs.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F7FA')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E3E8EF')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_docs)
        story.append(Spacer(1, 14))

        # 4. Forensic Findings Detail
        story.append(Paragraph("2. IDENTIFIED INCONSISTENCIES & FORENSIC OBSERVATIONS", section_style))
        if not findings:
            story.append(Paragraph("No inconsistencies or forensic anomalies detected across analyzed documents.", body_style))
        else:
            findings_data = [["Sev", "Category", "Observation & Explanation", "Review Status", "Evidence Source"]]
            for f in findings:
                sev = f.get("severity", "info").upper()
                cat = f.get("category", "").upper()
                title_exp = f"<b>{f.get('title', '')}</b><br/>{f.get('explanation', '')}"
                status = f.get("review_status", "unreviewed").upper()
                
                # Source references
                ev_lines = []
                for ev in f.get("evidence", []):
                    ev_lines.append(f"{ev.get('filename')} (p.{ev.get('page')}): {ev.get('value_observed')}")
                ev_text = "<br/>".join(ev_lines) if ev_lines else "Metadata / Heuristic"

                findings_data.append([
                    sev,
                    cat,
                    Paragraph(title_exp, body_style),
                    status,
                    Paragraph(ev_text, mono_style)
                ])

            t_findings = Table(findings_data, colWidths=[50, 75, 225, 70, 120])
            t_findings.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F5F7FA')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E3E8EF')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(t_findings)

        story.append(Spacer(1, 14))

        # 5. Methodological Limitations & Integrity Disclaimer
        story.append(Paragraph("3. METHODOLOGICAL LIMITATIONS & VERIFICATION ADVISORY", section_style))
        disclaimer_text = (
            "This document dossier was produced by the DocuForensics AI contextual analysis engine. "
            "All findings, extraction confidences, and anomaly scores represent automated observations derived from "
            "deterministic rules, PyMuPDF vector inspection, OpenCV heuristics, and Tesseract OCR models. "
            "These findings do not constitute legal proof of authenticity, forgery, or fraud. Human investigator sign-off "
            "and cross-verification against authoritative primary records remain mandatory."
        )
        story.append(Paragraph(disclaimer_text, body_style))
        story.append(Spacer(1, 20))

        # Sign-off box
        sign_data = [
            ["Lead Investigator Name:", "Signature:", "Date:"],
            ["_________________________", "_________________________", "_________________________"]
        ]
        t_sign = Table(sign_data, colWidths=[180, 180, 180])
        t_sign.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#667085')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(KeepTogether(t_sign))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

dossier_service = DossierService()

