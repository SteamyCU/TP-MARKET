import React from 'react';
import { FileText } from 'lucide-react';

interface B2BInvoicePDFProps {
  invoice: any;
  partner: any;
}

export const B2BInvoicePDF = React.forwardRef<HTMLDivElement, B2BInvoicePDFProps>(({ invoice, partner }, ref) => {
  return (
    <div ref={ref} className="p-12 bg-white text-tp-blue font-sans max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-tp-blue pb-8 mb-8">
        <div>
          <div className="text-4xl font-black italic tracking-tighter flex mb-4">
            <span className="text-tp-blue">T</span>
            <span className="text-tp-red">P</span>
            <span className="ml-2 text-2xl not-italic font-bold self-end pb-1">TO PAQUETE</span>
          </div>
          <div className="text-sm space-y-1 opacity-70">
            <p>Calle Falsa 123, Madrid, España</p>
            <p>CIF: B12345678</p>
            <p>soporte@topaquete.com</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-black uppercase mb-2">Factura B2B</h1>
          <div className="text-sm space-y-1">
            <p><span className="font-bold">Nº Factura:</span> {invoice.id?.slice(-8).toUpperCase()}</p>
            <p><span className="font-bold">Fecha:</span> {invoice.createdAt?.toDate().toLocaleDateString()}</p>
            <p><span className="font-bold">Mes:</span> {invoice.month}</p>
          </div>
        </div>
      </div>

      {/* Partner Info */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold uppercase text-tp-blue/40 mb-3 tracking-widest">Facturar a:</h3>
          <div className="space-y-1">
            <p className="text-xl font-black">{partner.businessName}</p>
            <p className="text-sm">{partner.name}</p>
            <p className="text-sm">{partner.direccion}</p>
            <p className="text-sm">{partner.email}</p>
            <p className="text-sm">{partner.telefono}</p>
          </div>
        </div>
        <div className="bg-tp-blue-light/30 p-6 rounded-2xl border border-tp-blue/10">
          <h3 className="text-xs font-bold uppercase text-tp-blue/40 mb-3 tracking-widest">Resumen:</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Paquetes:</span>
              <span className="font-bold">{invoice.items?.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Peso Total:</span>
              <span className="font-bold">{invoice.totalPeso?.toFixed(2)} Kg</span>
            </div>
            <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-tp-blue/10">
              <span>Total:</span>
              <span className="text-tp-red">€{invoice.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-sm mb-12">
        <thead>
          <tr className="bg-tp-blue text-white">
            <th className="px-4 py-3 text-left rounded-l-xl">Tracking</th>
            <th className="px-4 py-3 text-right">Peso (Kg)</th>
            <th className="px-4 py-3 text-right">Precio (€/Kg)</th>
            <th className="px-4 py-3 text-right rounded-r-xl">Subtotal (€)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-tp-gray-soft">
          {invoice.items?.map((item: any, idx: number) => (
            <tr key={idx}>
              <td className="px-4 py-3 font-mono font-bold">{item.tracking}</td>
              <td className="px-4 py-3 text-right">{item.peso.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{item.precio.toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-bold">€{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="border-t border-tp-gray-soft pt-8 text-center">
        <p className="text-xs text-tp-blue/40 leading-relaxed">
          Esta factura ha sido generada automáticamente por el sistema de gestión de To Paquete.<br />
          Por favor, realice el pago antes de los próximos 15 días a la cuenta bancaria indicada en su contrato.<br />
          Gracias por su confianza.
        </p>
      </div>
    </div>
  );
});

B2BInvoicePDF.displayName = 'B2BInvoicePDF';
