import React from 'react';

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center">
          {/* Logo e Marchio */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              my.pentashop.world
            </h3>
            <p className="text-blue-200 text-sm">
              Marchio di proprietà GLG CAPITAL GROUP LLC
            </p>
          </div>

          {/* Dati Aziendali */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* GLG CAPITAL GROUP LLC */}
            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="font-semibold text-blue-200 mb-2">GLG CAPITAL GROUP LLC</h4>
              <p className="text-sm text-gray-300">
                1309 Coffeen Avenue STE 1200<br />
                82801 Sheridan, Wyoming (USA)
              </p>
            </div>

            {/* Magnificus Dominus Consulting Europe Srl */}
            <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
              <h4 className="font-semibold text-blue-200 mb-2">
                Magnificus Dominus Consulting Europe Srl
              </h4>
              <p className="text-sm text-gray-300">
                Rappresentante in Italia<br />
                Via della Rondinella 63, Firenze<br />
                Capitale sociale: €115.000 interamente versati<br />
                Codice fiscale e P.IVA: 02394750745
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400">
              © 2024 my.pentashop.world - Tutti i diritti riservati
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 