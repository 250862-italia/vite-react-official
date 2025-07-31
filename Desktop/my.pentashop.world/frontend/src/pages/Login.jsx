import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import Footer from '../components/Layout/Footer';

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    city: '',
    sponsorCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let endpoint;
      let data;

      if (isForgotPassword) {
        endpoint = '/auth/forgot-password';
        data = { email: formData.email };
      } else if (isRegistering) {
        endpoint = '/auth/register';
        data = formData;
        
        // Validazione codice sponsor obbligatorio per registrazione
        if (!formData.sponsorCode || formData.sponsorCode.trim() === '') {
          setError('Il codice referral di un ambassador iscritto è obbligatorio per la registrazione.');
          setLoading(false);
          return;
        }
      } else {
        endpoint = '/auth/login';
        data = {
          username: formData.username,
          password: formData.password
        };
      }

      const response = await axios.post(getApiUrl(endpoint), data);
      
      if (response.data.success) {
        if (isForgotPassword) {
          setSuccess('Email di recupero password inviata. Controlla la tua casella email.');
          setTimeout(() => {
            setIsForgotPassword(false);
            setSuccess('');
          }, 3000);
        } else if (isRegistering) {
          setSuccess(response.data.message);
          setTimeout(() => {
            // Redirect based on user role
            if (response.data.data.user.role === 'admin') {
              navigate('/admin');
            } else if (response.data.data.user.role === 'guest') {
              navigate('/guest');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          localStorage.setItem('token', response.data.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          console.log('✅ Auth successful, user saved:', response.data.data.user);
          
          // Redirect based on user role
          if (response.data.data.user.role === 'admin') {
            navigate('/admin');
          } else if (response.data.data.user.role === 'guest') {
            navigate('/guest');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Errore auth:', err);
      setError(err.response?.data?.error || `Errore durante ${isForgotPassword ? 'il recupero password' : isRegistering ? 'la registrazione' : 'il login'}. Riprova.`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      country: '',
      city: '',
      sponsorCode: ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      {/* Background with animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-600 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white text-3xl font-bold">🛍️</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              MY.PENTASHOP.WORLD
            </h1>
            <p className="text-neutral-600">
              {isForgotPassword ? 'Recupera Password' : isRegistering ? 'Registrazione Ambassador' : 'Piattaforma Gamificata per Ambasciatori'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-slide-in">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-slide-in">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Forgot Password Form */}
            {isForgotPassword ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-400">📧</span>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Inserisci la tua email"
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-400">👤</span>
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Inserisci il tuo username"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-400">🔒</span>
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Inserisci la tua password"
                      required
                    />
                  </div>
                </div>

                {/* Campi di registrazione */}
                {isRegistering && (
                  <>
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-neutral-400">📧</span>
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Inserisci la tua email"
                          required
                        />
                      </div>
                    </div>

                    {/* Nome e Cognome */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                          Nome *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Nome"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                          Cognome *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Cognome"
                          required
                        />
                      </div>
                    </div>

                    {/* Telefono */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                        Telefono
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-neutral-400">📱</span>
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="+39 123 456 7890"
                        />
                      </div>
                    </div>

                    {/* Città e Paese */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                          Città
                        </label>
                        <select
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Seleziona città</option>
                          <option value="Milano">Milano</option>
                          <option value="Roma">Roma</option>
                          <option value="Napoli">Napoli</option>
                          <option value="Torino">Torino</option>
                          <option value="Palermo">Palermo</option>
                          <option value="Genova">Genova</option>
                          <option value="Bologna">Bologna</option>
                          <option value="Firenze">Firenze</option>
                          <option value="Bari">Bari</option>
                          <option value="Catania">Catania</option>
                          <option value="Venezia">Venezia</option>
                          <option value="Verona">Verona</option>
                          <option value="Messina">Messina</option>
                          <option value="Padova">Padova</option>
                          <option value="Trieste">Trieste</option>
                          <option value="Brescia">Brescia</option>
                          <option value="Parma">Parma</option>
                          <option value="Taranto">Taranto</option>
                          <option value="Prato">Prato</option>
                          <option value="Modena">Modena</option>
                          <option value="Reggio Calabria">Reggio Calabria</option>
                          <option value="Reggio Emilia">Reggio Emilia</option>
                          <option value="Perugia">Perugia</option>
                          <option value="Livorno">Livorno</option>
                          <option value="Ravenna">Ravenna</option>
                          <option value="Cagliari">Cagliari</option>
                          <option value="Foggia">Foggia</option>
                          <option value="Rimini">Rimini</option>
                          <option value="Salerno">Salerno</option>
                          <option value="Ferrara">Ferrara</option>
                          <option value="Latina">Latina</option>
                          <option value="Giugliano in Campania">Giugliano in Campania</option>
                          <option value="Monza">Monza</option>
                          <option value="Sassari">Sassari</option>
                          <option value="Bergamo">Bergamo</option>
                          <option value="Pescara">Pescara</option>
                          <option value="Trento">Trento</option>
                          <option value="Vicenza">Vicenza</option>
                          <option value="Bolzano">Bolzano</option>
                          <option value="Novara">Novara</option>
                          <option value="Udine">Udine</option>
                          <option value="Siracusa">Siracusa</option>
                          <option value="Ancona">Ancona</option>
                          <option value="Andria">Andria</option>
                          <option value="Arezzo">Arezzo</option>
                          <option value="Lecce">Lecce</option>
                          <option value="Pesaro">Pesaro</option>
                          <option value="Alessandria">Alessandria</option>
                          <option value="Barletta">Barletta</option>
                          <option value="Cesena">Cesena</option>
                          <option value="Piacenza">Piacenza</option>
                          <option value="Terni">Terni</option>
                          <option value="Forlì">Forlì</option>
                          <option value="Brindisi">Brindisi</option>
                          <option value="Treviso">Treviso</option>
                          <option value="Como">Como</option>
                          <option value="Marsala">Marsala</option>
                          <option value="Grosseto">Grosseto</option>
                          <option value="Varese">Varese</option>
                          <option value="Asti">Asti</option>
                          <option value="Pistoia">Pistoia</option>
                          <option value="Cremona">Cremona</option>
                          <option value="La Spezia">La Spezia</option>
                          <option value="Viterbo">Viterbo</option>
                          <option value="Altre">Altre</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-2">
                          Paese
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Seleziona paese</option>
                          <option value="Italia">Italia</option>
                          <option value="Francia">Francia</option>
                          <option value="Germania">Germania</option>
                          <option value="Spagna">Spagna</option>
                          <option value="Regno Unito">Regno Unito</option>
                          <option value="Svizzera">Svizzera</option>
                          <option value="Austria">Austria</option>
                          <option value="Belgio">Belgio</option>
                          <option value="Paesi Bassi">Paesi Bassi</option>
                          <option value="Svezia">Svezia</option>
                          <option value="Norvegia">Norvegia</option>
                          <option value="Danimarca">Danimarca</option>
                          <option value="Finlandia">Finlandia</option>
                          <option value="Polonia">Polonia</option>
                          <option value="Repubblica Ceca">Repubblica Ceca</option>
                          <option value="Ungheria">Ungheria</option>
                          <option value="Slovacchia">Slovacchia</option>
                          <option value="Slovenia">Slovenia</option>
                          <option value="Croazia">Croazia</option>
                          <option value="Serbia">Serbia</option>
                          <option value="Bulgaria">Bulgaria</option>
                          <option value="Romania">Romania</option>
                          <option value="Grecia">Grecia</option>
                          <option value="Portogallo">Portogallo</option>
                          <option value="Irlanda">Irlanda</option>
                          <option value="Lussemburgo">Lussemburgo</option>
                          <option value="Malta">Malta</option>
                          <option value="Cipro">Cipro</option>
                          <option value="Estonia">Estonia</option>
                          <option value="Lettonia">Lettonia</option>
                          <option value="Lituania">Lituania</option>
                          <option value="Stati Uniti">Stati Uniti</option>
                          <option value="Canada">Canada</option>
                          <option value="Messico">Messico</option>
                          <option value="Brasile">Brasile</option>
                          <option value="Argentina">Argentina</option>
                          <option value="Cile">Cile</option>
                          <option value="Colombia">Colombia</option>
                          <option value="Perù">Perù</option>
                          <option value="Venezuela">Venezuela</option>
                          <option value="Ecuador">Ecuador</option>
                          <option value="Uruguay">Uruguay</option>
                          <option value="Paraguay">Paraguay</option>
                          <option value="Bolivia">Bolivia</option>
                          <option value="Australia">Australia</option>
                          <option value="Nuova Zelanda">Nuova Zelanda</option>
                          <option value="Giappone">Giappone</option>
                          <option value="Corea del Sud">Corea del Sud</option>
                          <option value="Cina">Cina</option>
                          <option value="India">India</option>
                          <option value="Russia">Russia</option>
                          <option value="Turchia">Turchia</option>
                          <option value="Israele">Israele</option>
                          <option value="Emirati Arabi Uniti">Emirati Arabi Uniti</option>
                          <option value="Arabia Saudita">Arabia Saudita</option>
                          <option value="Qatar">Qatar</option>
                          <option value="Kuwait">Kuwait</option>
                          <option value="Bahrain">Bahrain</option>
                          <option value="Oman">Oman</option>
                          <option value="Giordania">Giordania</option>
                          <option value="Libano">Libano</option>
                          <option value="Siria">Siria</option>
                          <option value="Iraq">Iraq</option>
                          <option value="Iran">Iran</option>
                          <option value="Pakistan">Pakistan</option>
                          <option value="Afghanistan">Afghanistan</option>
                          <option value="Bangladesh">Bangladesh</option>
                          <option value="Sri Lanka">Sri Lanka</option>
                          <option value="Nepal">Nepal</option>
                          <option value="Bhutan">Bhutan</option>
                          <option value="Myanmar">Myanmar</option>
                          <option value="Thailandia">Thailandia</option>
                          <option value="Vietnam">Vietnam</option>
                          <option value="Laos">Laos</option>
                          <option value="Cambogia">Cambogia</option>
                          <option value="Malaysia">Malaysia</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Indonesia">Indonesia</option>
                          <option value="Filippine">Filippine</option>
                          <option value="Taiwan">Taiwan</option>
                          <option value="Hong Kong">Hong Kong</option>
                          <option value="Macao">Macao</option>
                          <option value="Mongolia">Mongolia</option>
                          <option value="Kazakistan">Kazakistan</option>
                          <option value="Kirghizistan">Kirghizistan</option>
                          <option value="Tagikistan">Tagikistan</option>
                          <option value="Uzbekistan">Uzbekistan</option>
                          <option value="Turkmenistan">Turkmenistan</option>
                          <option value="Azerbaigian">Azerbaigian</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Armenia">Armenia</option>
                          <option value="Ucraina">Ucraina</option>
                          <option value="Bielorussia">Bielorussia</option>
                          <option value="Moldavia">Moldavia</option>
                          <option value="Albania">Albania</option>
                          <option value="Macedonia del Nord">Macedonia del Nord</option>
                          <option value="Kosovo">Kosovo</option>
                          <option value="Montenegro">Montenegro</option>
                          <option value="Bosnia ed Erzegovina">Bosnia ed Erzegovina</option>
                          <option value="Altre">Altre</option>
                        </select>
                      </div>
                    </div>

                    {/* Codice Sponsor - OBBLIGATORIO */}
                    <div>
                      <label htmlFor="sponsorCode" className="block text-sm font-medium text-neutral-700 mb-2">
                        Codice Referral Ambassador * <span className="text-red-500">(Obbligatorio)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-neutral-400">👥</span>
                        </div>
                        <input
                          type="text"
                          id="sponsorCode"
                          name="sponsorCode"
                          value={formData.sponsorCode}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Codice referral ambassador iscritto"
                          required
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        È necessario il codice referral di un ambassador già iscritto per registrarsi
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>
                    {isForgotPassword ? 'Invio in corso...' : isRegistering ? 'Registrazione in corso...' : 'Accesso in corso...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {isForgotPassword ? '📧' : isRegistering ? '🌟' : '🚀'}
                  </span>
                  <span>
                    {isForgotPassword ? 'Invia Email Recupero' : isRegistering ? 'Registrati come Ambassador' : 'Accedi'}
                  </span>
                </>
              )}
            </button>

            {/* Action Links */}
            <div className="text-center space-y-3">
              {/* Forgot Password Link */}
              {!isRegistering && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    resetForm();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                >
                  🔑 Password dimenticata?
                </button>
              )}

              {/* Back to Login from Forgot Password */}
              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    resetForm();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                >
                  ← Torna al Login
                </button>
              )}

              {/* Toggle Login/Register */}
              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    resetForm();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                >
                  {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati come Ambassador'}
                </button>
              )}
            </div>
          </form>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">
              ✨ Funzionalità Disponibili
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
              <div className="flex items-center space-x-1">
                <span>🎯</span>
                <span>Task Gamificati</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🏆</span>
                <span>Badge System</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>💰</span>
                <span>Commissioni</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>👥</span>
                <span>Referral MLM</span>
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Login; 