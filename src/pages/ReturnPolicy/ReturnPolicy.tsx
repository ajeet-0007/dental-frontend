import { Link } from 'react-router-dom';
import Seo from '@/components/seo/Seo';
import { COMPANY } from '@/constants/company';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Package,
  Phone,
  RotateCcw,
  ShieldAlert,
  Truck,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

type PolicySection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
};

const ReturnPolicy = () => {
  const [openSection, setOpenSection] = useState<string>('summary');

  const sections: PolicySection[] = [
    {
      id: 'summary',
      title: 'Quick Policy Summary',
      icon: Info,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-600" />
                Order cancelled before dispatch
              </h4>
              <p className="text-sm text-gray-600">The order will be cancelled. No refund is required because COD payment has not been collected.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4 text-violet-600" />
                Wrong product delivered
              </h4>
              <p className="text-sm text-gray-600">Free replacement will be arranged where applicable. If a suitable replacement is unavailable, an applicable refund may be issued.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-600" />
                Product damaged during transit
              </h4>
              <p className="text-sm text-gray-600">Free replacement or refund after verification.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-violet-600" />
                Defective eligible product
              </h4>
              <p className="text-sm text-gray-600">Raise a return/replacement request within 10 calendar days of confirmed delivery.</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                COD Orders
              </h4>
              <p className="text-sm text-gray-600">Dentzoo currently accepts Cash on Delivery (COD) only. Payment is collected on delivery. If cancelled/refused before payment, no monetary refund is required. If payment has been collected, approved refunds are processed electronically to your verified UPI ID or bank account.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'window',
      title: '10-Day Return & Replacement Window',
      icon: Clock,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Dentzoo offers a 10-calendar-day return and replacement window for eligible products.</p>
          <p className="text-sm text-gray-600">The 10-day period begins from the date the order is shown as successfully delivered.</p>
          <p className="text-sm text-gray-600">For a standard return, the product must normally be unused, in original condition, with original seal intact, undamaged original packaging, all accessories/components/manuals/warranty cards/promotional items, and matching serial/batch/product identification numbers.</p>
          <p className="text-sm text-gray-600">For defective, damaged, incorrect or incomplete products, replacement will normally be Dentzoo's first resolution option. If an appropriate replacement is unavailable, Dentzoo may issue an applicable refund.</p>
        </div>
      ),
    },
    {
      id: 'inspection',
      title: 'Check Your Order at Delivery',
      icon: Package,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Inspect the shipment on receipt. If the outer package is visibly damaged, opened or tampered with, refuse delivery where reasonably possible and contact Dentzoo.</p>
          <p className="text-sm text-gray-600">If the outer package appears normal, accept and check after opening. Retain shipping packaging until products are verified as correct and undamaged.</p>
        </div>
      ),
    },
    {
      id: 'reporting',
      title: 'Report Delivery Problems Within 48 Hours',
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Report damaged, wrong, missing, missing component, broken seal, tampered packaging, incorrect quantity, expired, or significant physical damage within 48 hours of delivery.</p>
          <p className="text-sm text-gray-600 mb-2">When raising a request, please provide:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Dentzoo Order ID</li>
            <li>Product name</li>
            <li>Description of the issue</li>
            <li>Clear photographs of the product</li>
            <li>Photographs of the outer packaging</li>
            <li>Photograph of the shipping label</li>
            <li>Batch number, where applicable</li>
            <li>Serial number, where applicable</li>
          </ul>
          <p className="text-sm text-gray-600">Requests after 48 hours may require additional verification and will be reviewed based on circumstances and product category.</p>
        </div>
      ),
    },
    {
      id: 'nonreturnable',
      title: 'Non-Returnable Products',
      icon: ShieldAlert,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Certain products cannot normally be returned due to hygiene, sterility, patient-safety, regulatory or resale considerations.</p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
            <li><span className="font-medium">Opened sterile products:</span> Not returnable once sterile packaging is opened, seal is broken, or sterility may be compromised.</li>
            <li><span className="font-medium">Patient-contact / hygiene-sensitive products:</span> May become non-returnable once opened.</li>
            <li><span className="font-medium">Medicines and pharmaceutical products:</span> Generally not returnable for change of mind. Exceptions apply for incorrect, damaged, expired, defective, recalled or incorrectly supplied items.</li>
            <li><span className="font-medium">Dental consumables:</span> May become non-returnable once opened (e.g. burs, disposables, applicator tips, single-use instruments, certain restorative/endodontic/impression materials).</li>
            <li><span className="font-medium">Custom/special orders:</span> Not normally returnable for change of mind if specially sourced, imported, configured or ordered for a specific customer.</li>
            <li><span className="font-medium">Short-expiry products:</span> Not returnable solely because of expiry disclosed before purchase.</li>
          </ul>
          <p className="text-sm text-gray-600">Legitimate complaints (damaged, defective, expired, incorrect, compromised packaging, materially different) will be reviewed individually.</p>
        </div>
      ),
    },
    {
      id: 'equipment',
      title: 'Dental Equipment',
      icon: Wrench,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Equipment may require troubleshooting/technical verification before approving replacement/refund (telephone/video troubleshooting, remote support, inspection, technician assessment, or manufacturer verification).</p>
          <p className="text-sm text-gray-600">Once equipment has been successfully installed or materially used, it cannot normally be returned for change of mind. Technical faults later are handled under applicable manufacturer/importer/distributor warranty.</p>
        </div>
      ),
    },
    {
      id: 'warranty',
      title: 'Warranty',
      icon: CheckCircle2,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">If an eligible product develops a qualifying defect within 10 days of confirmed delivery, contact Dentzoo. After 10 days, the applicable manufacturer/importer/distributor warranty applies where available. Dentzoo will assist in connecting with the warranty provider.</p>
          <p className="text-sm text-gray-600">Warranty may not cover misuse, accidental physical damage, improper installation, unauthorized modification, tampering, serial-number alteration, or use contrary to manufacturer instructions.</p>
        </div>
      ),
    },
    {
      id: 'request',
      title: 'How to Request a Return or Replacement',
      icon: Phone,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Contact Dentzoo via:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Website: <Link to="/help" className="text-violet-600 hover:underline">Help & Support</Link></li>
            <li>WhatsApp: <a href={`https://wa.me/${COMPANY.contact.whatsapp}`} className="text-violet-600 hover:underline" target="_blank" rel="noopener noreferrer">{COMPANY.contact.phoneDisplay}</a></li>
            <li>Phone: <a href={`tel:${COMPANY.contact.phone}`} className="text-violet-600 hover:underline">{COMPANY.contact.phoneDisplay}</a></li>
            <li>Email: <a href={`mailto:${COMPANY.contact.email}`} className="text-violet-600 hover:underline">{COMPANY.contact.email}</a></li>
          </ul>
          <p className="text-sm text-gray-600">Do not send products back before receiving return instructions from Dentzoo.</p>
        </div>
      ),
    },
    {
      id: 'logistics',
      title: 'Reverse Pickup, QC & Refunds (COD)',
      icon: Truck,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Dentzoo will bear reasonable reverse-logistics costs for wrong product, damaged, defective (subject to verification), incorrect quantity, missing item/component, expired incorrectly supplied, or error attributable to Dentzoo.</p>
          <p className="text-sm text-gray-600">For approved change-of-mind returns where the correct undamaged product was delivered, return-shipping cost may be borne by the customer; this will be communicated before approval.</p>
          <p className="text-sm text-gray-600">Returned products may undergo QC before replacement/refund. For COD orders where payment was collected, refunds are made electronically via UPI or bank transfer to verified details provided through official channels.</p>
          <p className="text-sm text-gray-600">After QC/approval, refunds are typically initiated within 24–48 business hours; banking/UPI processing may take additional time.</p>
        </div>
      ),
    },
  ];

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? '' : id);
  };

  return (
    <>
      <Seo
        title="Return & Refund Policy | Dentzoo"
        description="Dentzoo return, replacement, cancellation and refund policy for dental products. 10-day window, COD handling, non-returnable items, warranty, and contact details."
        canonical="/return-policy"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest">Legal</p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Return, Replacement, Cancellation & Refund Policy</h1>
              </div>
            </div>
            <p className="text-sm text-gray-600">Last Updated: October 2026</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {sections.map(({ id, title, icon: Icon, content }) => {
              const isOpen = openSection === id;
              return (
                <div key={id} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`section-${id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-violet-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg
                        className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  <div
                    id={`section-${id}`}
                    className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="px-5 pb-5 pt-0">{content}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Contact Dentzoo
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900 mb-1">Support</p>
                <p className="text-sm text-gray-600">Hours: {COMPANY.contact.hours}</p>
                <p className="text-sm text-gray-600">
                  Email: <a href={`mailto:${COMPANY.contact.email}`} className="text-violet-600 hover:underline">{COMPANY.contact.email}</a>
                </p>
                <p className="text-sm text-gray-600">
                  Phone: <a href={`tel:${COMPANY.contact.phone}`} className="text-violet-600 hover:underline">{COMPANY.contact.phoneDisplay}</a>
                </p>
                <p className="text-sm text-gray-600">
                  WhatsApp: <a href={`https://wa.me/${COMPANY.contact.whatsapp}`} className="text-violet-600 hover:underline" target="_blank" rel="noopener noreferrer">{COMPANY.contact.phoneDisplay}</a>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <Link to="/help" className="text-violet-600 hover:underline">Submit a request via Help & Support</Link>
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-medium text-gray-900 mb-1">Legal Seller</p>
                <p className="text-sm text-gray-600">{COMPANY.legalName} ({COMPANY.tradeName})</p>
                <p className="text-sm text-gray-600">{COMPANY.gstinLabel}: {COMPANY.gstin}</p>
                <p className="text-sm text-gray-600 mt-2">Registered Address:</p>
                <p className="text-sm text-gray-600">{COMPANY.address.floor}, {COMPANY.address.building}, {COMPANY.address.street},</p>
                <p className="text-sm text-gray-600">{COMPANY.address.locality}, {COMPANY.address.city}, {COMPANY.address.district},</p>
                <p className="text-sm text-gray-600">{COMPANY.address.state} - {COMPANY.address.pin}, {COMPANY.address.country}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnPolicy;
