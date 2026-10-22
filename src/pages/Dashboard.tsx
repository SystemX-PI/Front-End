export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-[#161B26] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-white">Painel operacional</h1>

        <p className="text-gray-400 mt-3">
          Os indicadores da operação serão exibidos quando houver dados reais disponíveis no backend.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0B0F17] border border-white/10 rounded-xl p-5 text-left">
            <p className="text-gray-400 text-sm">Contemplados</p>
            <h2 className="text-2xl font-bold text-[#007BFF] mt-2">—</h2>
          </div>

          <div className="bg-[#0B0F17] border border-white/10 rounded-xl p-5 text-left">
            <p className="text-gray-400 text-sm">Pendências</p>
            <h2 className="text-2xl font-bold text-[#00FFC2] mt-2">—</h2>
          </div>

          <div className="bg-[#0B0F17] border border-white/10 rounded-xl p-5 text-left">
            <p className="text-gray-400 text-sm">Baixas em análise</p>
            <h2 className="text-2xl font-bold text-white mt-2">—</h2>
          </div>
        </div>
      </div>
    </div>
  );
}