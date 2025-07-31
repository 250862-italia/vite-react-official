import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

function ContractPage() {
  const [user, setUser] = useState(null);
  const [contractStatus, setContractStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    setUser(userObj);

    const fetchContractStatus = async () => {
      try {
        const response = await axios.get(getApiUrl('/contract/status'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setContractStatus(response.data.data.contractStatus);
      } catch (err) {
        setError('Errore nel recupero dello stato del contratto.');
        console.error('Error fetching contract status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContractStatus();
  }, [navigate]);

  const handleSignContract = async () => {
    setSigning(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(getApiUrl('/contract/sign'), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(response.data.message);
      setContractStatus('signed');
      // Update local storage user state if necessary
      const updatedUser = { ...user, contractStatus: 'signed', state: 'pending_admin_approval' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Redirect to ambassador dashboard after successful contract signing
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500); // Wait 1.5 seconds to show success message
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante la firma del contratto.');
      console.error('Error signing contract:', err);
    } finally {
      setSigning(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento contratto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Contratto Digitale
              </h1>
              <p className="text-gray-600 mt-2">
                Firmando digitalmente il presente contratto, dichiari di aver letto, compreso e accettato integralmente tutte le clausole in esso contenute, inclusi gli eventuali allegati. La firma digitale costituisce a tutti gli effetti manifestazione di volontà vincolante e autorizza la prosecuzione delle attività previste.
              </p>
            </div>
            <div className="text-right">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                contractStatus?.contractStatus === 'signed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                Status: {contractStatus?.contractStatus === 'signed' ? 'Firmato' : 'Non firmato'}
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Contract Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contratto di Collaborazione</h2>
          
          <div className="prose max-w-none text-gray-700 space-y-4 text-left">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800">COMUNICAZIONE IMPORTANTE</h3>
                  <p className="text-yellow-700 mt-1">
                    Con l'accettazione e l'acquisto del Welcome Kit e la firma digitale attraverso il portale MY.PENTASHOP.WORLD, 
                    l'Ambassador dichiara di accettare integralmente tutte le clausole previste nei seguenti documenti contrattuali: 
                    <strong>Delega di Contratto, Mandato di Vendita Non Esclusivo e Informativa sulla Privacy</strong>. 
                    Tale accettazione ha valore legale e vincolante ai fini dell'esecuzione del rapporto contrattuale.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3 text-blue-800">DELEGA DI CONTRATTO</h3>
            <p className="mb-4">
              <strong>Tra:</strong> Magnificus Dominus Consulting Europe Srl con sede legale in via della Rondinella 63, Firenze, 
              codice fiscale e partita IVA 02394750745, capitale sociale di 115.000 euro, rappresentata legalmente dal sig. GIANNI INNOCENTI, 
              di seguito denominata "Delegante", e Sig./Sig.ra 
              <em>(I dati anagrafici e fiscali del Delegante si intendono quelli forniti in fase di registrazione sul portale di gestione 
              MY.PENTASHOP.WORLD e saranno utilizzati per tutte le comunicazioni e gli adempimenti previsti dal presente contratto.)</em>, 
              di seguito denominato/a "Delegato".
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Premesso che:</h4>
            <ul className="list-disc pl-6 mb-4">
              <li>La Delegante ha stipulato un contratto per la gestione e la promozione del prodotto "PENTAWASH";</li>
              <li>La Delegante intende delegare al Delegato, libero professionista non subordinato e non assunto, l'esecuzione di specifici obblighi contrattuali connessi al suddetto contratto;</li>
              <li>Il Delegato accetta tale delega alle condizioni qui di seguito specificate;</li>
            </ul>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 1: Oggetto della delega</h4>
            <p className="mb-2"><strong>1.1</strong> La Delegante delega al Delegato l'esecuzione delle seguenti attività:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Promozione del prodotto PENTAWASH;</li>
              <li>Vendita del prodotto PENTAWASH;</li>
            </ul>
            <p className="mb-4"><strong>1.2</strong> Il Delegato si impegna a svolgere le attività delegate nel rispetto delle condizioni e dei termini previsti nel contratto principale.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 2: Responsabilità</h4>
            <p className="mb-2"><strong>2.1</strong> Il Delegato assume piena responsabilità per l'esecuzione delle attività delegate, manlevando la Delegante da ogni responsabilità derivante dall'adempimento o dall'inadempimento delle stesse.</p>
            <p className="mb-4"><strong>2.2</strong> La Delegante rimane responsabile nei confronti della controparte contrattuale per gli obblighi previsti nel contratto principale.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 3: Natura dell'incarico</h4>
            <p className="mb-4"><strong>3.1</strong> Il rapporto tra la Delegante e il Delegato è di natura professionale autonoma. Il Delegato opera in piena autonomia gestionale, organizzativa e senza vincoli di subordinazione o di orario.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 4: Durata</h4>
            <p className="mb-4"><strong>4.1</strong> La presente delega ha effetto a partire dalla data di sottoscrizione e durerà fino al (1 anno dalla firma dell'iscrizione nel portale MY.PENTASHOP.WORLD), salvo rinnovo o revoca anticipata comunicata per iscritto.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 5: Riservatezza</h4>
            <p className="mb-4"><strong>5.1</strong> Il Delegato si impegna a mantenere riservate tutte le informazioni relative al contratto principale e alle attività delegate, anche dopo la cessazione della presente delega.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 6: Risoluzione</h4>
            <p className="mb-2"><strong>6.1</strong> La Delegante si riserva il diritto di revocare la presente delega in caso di inadempimento da parte del Delegato o per altre cause giustificate, previa comunicazione scritta.</p>
            <p className="mb-4"><strong>6.2</strong> In caso di revoca o risoluzione, il Delegato dovrà restituire immediatamente alla Delegante tutti i documenti e materiali relativi al contratto.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 7: Controversie</h4>
            <p className="mb-6"><strong>7.1</strong> Per ogni controversia derivante dalla presente delega, le parti eleggono come foro competente il Tribunale di Firenze.</p>

            <div className="text-center border-t pt-4 mb-6">
              <p><strong>La Delegante</strong></p>
              <p>Magnificus Dominus Consulting Europe Srl</p>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3 text-blue-800">MANDATO DI VENDITA NON ESCLUSIVO</h3>
            <p className="mb-4">
              <strong>Tra:</strong> Magnificus Dominus Consulting Europe Srl con sede legale in via della Rondinella 63, Firenze, 
              codice fiscale e partita IVA 02394750745, capitale sociale di 115.000 euro, rappresentata legalmente dal sig. GIANNI INNOCENTI, 
              di seguito denominata "Mandante", e Sig./Sig.ra 
              <em>(I dati anagrafici e fiscali del Mandatario si intendono quelli forniti in fase di registrazione sul portale di gestione 
              MY.PENTASHOP.WORLD e saranno utilizzati per tutte le comunicazioni e gli adempimenti previsti dal presente contratto.)</em>, 
              di seguito denominato/a "Mandatario".
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Premesso che:</h4>
            <ul className="list-disc pl-6 mb-4">
              <li>La Mandante è distributrice esclusiva del prodotto "PENTAWASH", un innovativo panno imbevuto di detersivo per lavatrice, ideato per ridurre l'uso della plastica e contribuire alla salvaguardia dell'ambiente;</li>
              <li>Il Mandatario intende collaborare con la Mandante per la promozione e la vendita del suddetto prodotto;</li>
            </ul>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 1: Oggetto del mandato</h4>
            <p className="mb-4">
              La Mandante conferisce al Mandatario il mandato non esclusivo per la promozione e vendita del prodotto "PENTAWASH", 
              che rappresenta il prodotto principale della Mandante. Il Mandatario si impegna a svolgere l'attività di vendita nel rispetto 
              delle condizioni e delle direttive stabilite dalla Mandante. La Mandante si riserva inoltre la facoltà di affiancare ulteriori 
              prodotti al "PENTAWASH" durante la durata del presente mandato.
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 2: Modalità operative</h4>
            <p className="mb-2"><strong>2.1</strong> Il Mandatario promuoverà e venderà il prodotto "PENTAWASH" esclusivamente ai prezzi e alle condizioni stabilite dalla Mandante.</p>
            <p className="mb-2"><strong>2.2</strong> La Mandante fornirà al Mandatario il materiale informativo, i listini prezzi e il supporto necessario per lo svolgimento dell'attività.</p>
            <p className="mb-2"><strong>2.3</strong> Ogni vendita dovrà essere registrata e comunicata tempestivamente alla Mandante.</p>
            <p className="mb-2"><strong>2.4</strong> L'attività del Mandatario è svolta in completa autonomia e senza subordinazione ad alcun orario imposto dalla Mandante. Si sottolinea che non esiste alcun rapporto di subordinazione tra le parti, trattandosi di un accordo di collaborazione indipendente.</p>
            <p className="mb-2"><strong>2.5</strong> Tutta la gestione del lavoro sarà effettuata tramite il portale MY.PENTASHOP.WORLD.</p>
            <p className="mb-4"><strong>2.6</strong> L'acquisto del prodotto sarà effettuato esclusivamente con carta di credito; non saranno accettati pagamenti in contanti. Il prodotto potrà essere acquistato tramite il portale di gestione o attraverso il sito webshop della società.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 3: Compensi</h4>
            <p className="mb-2"><strong>3.1</strong> Il Mandatario riceverà le seguenti commissioni che troverà nel documento ufficiale in https://washtheworld.org/pianocommissioni/_password e saranno calcolate sul costo del prodotto escluso l'IVA (22%), in base al livello di qualifica raggiunto.</p>
            <p className="mb-2"><strong>3.2</strong> Il mese si chiude per le provvigioni con l'ultimo giorno disponibile di ogni mese. I pagamenti delle commissioni saranno effettuati entro il giorno 5 del mese successivo alla registrazione della vendita.</p>
            <p className="mb-4"><strong>3.3</strong> Una volta raggiunta la qualificazione, sia con i punti che con l'acquisto del Welcome Kit, il Mandatario non potrà più scendere di livello, salvo il mancato raggiungimento dell'obiettivo mensile per tre volte in un anno.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 4: Durata</h4>
            <p className="mb-4">Il presente mandato ha durata di 12 mesi a decorrere dalla data di sottoscrizione e sarà rinnovato tacitamente alla scadenza, salvo disdetta da comunicare per iscritto almeno 30 giorni prima.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 5: Obblighi del Mandatario</h4>
            <p className="mb-2"><strong>5.1</strong> Il Mandatario si impegna a promuovere il prodotto "PENTAWASH" in modo professionale, rispettando l'immagine e la reputazione della Mandante.</p>
            <p className="mb-4"><strong>5.2</strong> Il Mandatario non è autorizzato a rappresentare la Mandante in atti legali, contrattuali o amministrativi senza specifica autorizzazione scritta.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 6: Riservatezza</h4>
            <p className="mb-4">Il Mandatario si impegna a non divulgare informazioni riservate relative al prodotto "PENTAWASH" o alla Mandante, sia durante la durata del mandato che successivamente alla sua cessazione.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 7: Clausole aggiuntive</h4>
            <p className="mb-2"><strong>7.1 Responsabilità del Mandatario:</strong> Il Mandatario è tenuto a coprire eventuali danni causati durante la promozione o la vendita del prodotto tramite idonea polizza assicurativa.</p>
            <p className="mb-2"><strong>7.2 Esclusività territoriale:</strong> L'attività del Mandatario sarà limitata all'area geografica di Italia per evitare conflitti con altri mandatari.</p>
            <p className="mb-2"><strong>7.3 Obiettivi di vendita:</strong> Il Mandatario si impegna a raggiungere obiettivi minimi di vendita definiti dalla Mandante. In caso di mancato raggiungimento, il mandato potrà essere soggetto a revisione.</p>
            <p className="mb-2"><strong>7.4 Formazione:</strong> La Mandante fornirà formazione iniziale e periodica al Mandatario per garantire l'efficacia dell'attività promozionale.</p>
            <p className="mb-2"><strong>7.5 Politiche di reso e garanzia:</strong> Il Mandatario garantirà ai clienti modalità di reso conformi alle politiche della Mandante.</p>
            <p className="mb-2"><strong>7.6 Risarcimento danni:</strong> Il Mandatario è responsabile di risarcire la Mandante per eventuali danni causati alla reputazione o al brand.</p>
            <p className="mb-2"><strong>7.7 Utilizzo dei materiali di marketing:</strong> I materiali forniti dalla Mandante dovranno essere utilizzati esclusivamente per finalità promozionali autorizzate.</p>
            <p className="mb-2"><strong>7.8 Protezione del marchio:</strong> Il Mandatario non potrà registrare o utilizzare il marchio della Mandante senza previa autorizzazione.</p>
            <p className="mb-2"><strong>7.9 Forza maggiore:</strong> In caso di eventi straordinari, il presente mandato potrà essere sospeso o risolto.</p>
            <p className="mb-2"><strong>7.10 Monitoraggio delle performance:</strong> La Mandante potrà effettuare verifiche periodiche sull'attività del Mandatario.</p>
            <p className="mb-2"><strong>7.11 Obblighi post-contrattuali:</strong> Il Mandatario non potrà intraprendere attività concorrenti o divulgare informazioni riservate per un periodo di 12 mesi dalla cessazione del mandato.</p>
            <p className="mb-4"><strong>7.12 Aggiornamenti normativi:</strong> Il Mandatario si impegna a rispettare le normative vigenti in materia di commercio e tutela del consumatore.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 8: Risoluzione</h4>
            <p className="mb-4">La Mandante si riserva il diritto di revocare il presente mandato in caso di inadempimento da parte del Mandatario, previa comunicazione scritta.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 9: Controversie</h4>
            <p className="mb-4">Per ogni controversia derivante dal presente mandato, le parti eleggono come foro competente il Tribunale di Firenze. Tuttavia, si riservano la possibilità di ricorrere a arbitrato o mediazione come soluzione alternativa.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 10: Modalità fiscali per il Mandatario</h4>
            <p className="mb-2"><strong>10.1</strong> Se il Mandatario opera con partita IVA, dovrà emettere regolare fattura per le provvigioni ricevute, includendo l'IVA, se applicabile, secondo il regime fiscale adottato.</p>
            <p className="mb-2"><strong>10.2</strong> Se il Mandatario non è titolare di partita IVA, le provvigioni saranno soggette a ritenuta d'acconto del 20% come previsto dalla normativa fiscale vigente. La Mandante provvederà al relativo versamento all'Erario.</p>
            <p className="mb-2"><strong>10.3</strong> Le provvigioni percepite dal Mandatario saranno dichiarate come reddito imponibile nella propria dichiarazione dei redditi e saranno soggette all'IRPEF.</p>
            <p className="mb-4"><strong>10.4</strong> Il Mandatario è responsabile del versamento di eventuali contributi previdenziali dovuti, in base al proprio inquadramento fiscale e previdenziale.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 11: Privacy</h4>
            <p className="mb-2"><strong>11.1</strong> La Mandante e il Mandatario si impegnano a rispettare la normativa vigente in materia di protezione dei dati personali, ai sensi del Regolamento (UE) 2016/679 (GDPR) e delle normative nazionali applicabili.</p>
            <p className="mb-2"><strong>11.2</strong> I dati personali del Mandatario saranno trattati dalla Mandante esclusivamente per le finalità connesse all'esecuzione del presente mandato.</p>
            <p className="mb-4"><strong>11.3</strong> Il Mandatario autorizza la Mandante a trattare i propri dati personali conformemente alla Privacy Policy disponibile sul portale MY.PENTASHOP.WORLD.</p>

            <h4 className="text-lg font-semibold mt-4 mb-2">Articolo 12: Accettazione</h4>
            <p className="mb-6">Con la firma del presente mandato, il Mandatario dichiara di accettare integralmente le condizioni sopra descritte. La firma potrà essere effettuata anche digitalmente attraverso il portale MY.PENTASHOP.WORLD.</p>

            <div className="text-center border-t pt-4 mb-6">
              <p><strong>La Mandante</strong></p>
              <p>Magnificus Dominus Consulting Europe Srl</p>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-3 text-blue-800">INFORMATIVA SULLA PRIVACY</h3>
            <p className="mb-4">
              Ai sensi del Regolamento Generale sulla Protezione dei Dati (GDPR) e della normativa italiana vigente, 
              Magnificus Dominus Consulting Europe Srl, con sede legale in via della Rondinella 63, Firenze, 
              codice fiscale e partita IVA 02394750745, di seguito denominata "Titolare", informa gli utenti sulle modalità di trattamento dei dati personali.
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">1. Titolare del trattamento</h4>
            <p className="mb-4">
              Il Titolare del trattamento è Magnificus Dominus Consulting Europe Srl. Per qualsiasi richiesta relativa alla privacy, 
              è possibile contattare il Titolare all'indirizzo email privacy@magnificusdominuseurope.com.
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">2. Finalità del trattamento</h4>
            <p className="mb-2">I dati personali forniti saranno trattati per le seguenti finalità:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Gestione degli ordini e della consegna dei prodotti;</li>
              <li>Assistenza clienti e comunicazioni inerenti all'ordine;</li>
              <li>Invio di informazioni commerciali, promozioni e aggiornamenti relativi ai prodotti, previo consenso espresso dell'utente;</li>
              <li>Adempimento degli obblighi di legge.</li>
            </ul>

            <h4 className="text-lg font-semibold mt-4 mb-2">3. Base giuridica del trattamento</h4>
            <p className="mb-2">Il trattamento dei dati si basa sulle seguenti basi giuridiche:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Esecuzione di un contratto o misure precontrattuali (art. 6.1.b GDPR);</li>
              <li>Adempimento di obblighi legali (art. 6.1.c GDPR);</li>
              <li>Consenso esplicito per l'invio di comunicazioni promozionali (art. 6.1.a GDPR).</li>
            </ul>

            <h4 className="text-lg font-semibold mt-4 mb-2">4. Modalità di trattamento</h4>
            <p className="mb-4">
              Il trattamento dei dati personali sarà effettuato con strumenti elettronici e manuali, 
              garantendo la sicurezza e la riservatezza dei dati stessi.
            </p>

            <h4 className="text-lg font-semibold mt-4 mb-2">5. Conservazione dei dati</h4>
            <p className="mb-2">I dati personali saranno conservati per:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>La durata necessaria alla gestione del rapporto commerciale;</li>
              <li>Il periodo richiesto dalla normativa fiscale e contabile;</li>
              <li>Il tempo necessario a gestire eventuali controversie legali.</li>
            </ul>

            <h4 className="text-lg font-semibold mt-4 mb-2">6. Comunicazione dei dati</h4>
            <p className="mb-2">I dati personali potranno essere comunicati a:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Società di logistica e spedizione per la consegna dei prodotti;</li>
              <li>Fornitori di servizi IT per la gestione delle piattaforme tecnologiche;</li>
              <li>Autorità competenti, qualora richiesto dalla legge.</li>
            </ul>

            <h4 className="text-lg font-semibold mt-4 mb-2">7. Diritti degli interessati</h4>
            <p className="mb-2">L'utente ha il diritto di:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Accedere ai propri dati personali;</li>
              <li>Richiedere la rettifica o la cancellazione dei dati;</li>
              <li>Opporsi al trattamento o richiedere la limitazione;</li>
              <li>Ricevere i propri dati in un formato strutturato, di uso comune e leggibile da dispositivo automatico (portabilità dei dati);</li>
              <li>Revocare il consenso in qualsiasi momento, senza pregiudicare la liceità del trattamento basata sul consenso prima della revoca;</li>
              <li>Presentare un reclamo all'Autorità Garante per la Protezione dei Dati Personali.</li>
            </ul>

            <h4 className="text-lg font-semibold mt-4 mb-2">8. Modifiche all'informativa</h4>
            <p className="mb-6">
              La presente informativa può essere soggetta a modifiche o aggiornamenti. Gli utenti saranno informati di eventuali 
              cambiamenti significativi tramite i canali ufficiali del Titolare.
            </p>

            <div className="text-center border-t pt-4">
              <p><strong>Magnificus Dominus Consulting Europe Srl</strong></p>
              <p className="text-sm text-gray-600">Ultimo aggiornamento: 03/01/2024</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
          >
            Torna alla Dashboard
          </button>
          
          {contractStatus !== 'signed' && (
            <button
              onClick={handleSignContract}
              disabled={signing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
            >
              {signing ? 'Firmando...' : 'Firma Contratto'}
            </button>
          )}
          
          {contractStatus === 'signed' && (
            <div className="flex-1 bg-green-100 text-green-800 font-medium py-3 px-6 rounded-lg text-center">
              ✓ Contratto Firmato
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default ContractPage; 