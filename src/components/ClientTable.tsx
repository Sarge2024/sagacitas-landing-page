import { ClientData } from "./ClientModal";

interface ClientTableProps {
  clients: ClientData[];
}

export const ClientTable = ({ clients }: ClientTableProps) => {
  if (clients.length === 0) return null;

  return (
    <section className="py-24 bg-surface-container" id="clientes-cadastrados">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-12">
          <span className="text-primary-container font-bold tracking-[0.2em] uppercase text-sm">Registro Administrativo</span>
          <h2 className="text-4xl font-headline font-extrabold text-primary pt-2">Clientes Empresariais</h2>
          <p className="text-on-surface-variant max-w-2xl mt-4">
            Abaixo estão as empresas recém-cadastradas através da Área do Cliente.
          </p>
        </div>

        <div className="overflow-x-auto bg-surface-container-lowest rounded-lg shadow-sm border border-surface-container-high">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-sm uppercase tracking-wider font-bold">
                <th className="p-4 border-b border-surface-container-high">Data</th>
                <th className="p-4 border-b border-surface-container-high">Empresa / CNPJ</th>
                <th className="p-4 border-b border-surface-container-high">Contato</th>
                <th className="p-4 border-b border-surface-container-high">Setor</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-surface-container transition-colors group">
                  <td className="p-4 border-b border-surface-container-high text-sm font-medium text-on-surface-variant">
                    {client.date}
                  </td>
                  <td className="p-4 border-b border-surface-container-high">
                    <p className="font-bold text-primary">{client.companyName}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{client.cnpj}</p>
                  </td>
                  <td className="p-4 border-b border-surface-container-high">
                    <p className="text-sm font-semibold text-on-surface">{client.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{client.email}</p>
                    <p className="text-xs text-on-surface-variant">{client.phone}</p>
                  </td>
                  <td className="p-4 border-b border-surface-container-high">
                    <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold rounded-full">
                      {client.sector}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
