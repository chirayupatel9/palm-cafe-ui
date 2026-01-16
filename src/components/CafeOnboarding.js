import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Building2,
  Settings,
  Users,
  CheckSquare,
  Clock,
  Globe
} from 'lucide-react';

const CafeOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({});

  // Step 1: Cafe Basics
  const [cafeName, setCafeName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [openingHours, setOpeningHours] = useState({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: true }
  });

  // Step 2: Initial Configuration
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [enabledFeatures, setEnabledFeatures] = useState({
    orders: true,
    menu_management: true,
    customers: true,
    inventory: false,
    advanced_reports: false
  });

  // Step 3: Team Setup (optional)
  const [skipTeamSetup, setSkipTeamSetup] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({ email: '', role: 'staff' });

  const totalSteps = 4;

  // Common timezones
  const timezones = [
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
    { value: 'America/New_York', label: 'America/New_York (EST)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
    { value: 'Europe/London', label: 'Europe/London (GMT)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' }
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
  ];

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await axios.get('/onboarding/status');
      const data = response.data;
      
      if (data.is_onboarded) {
        // Already onboarded, redirect to dashboard
        navigate('/admin');
        return;
      }

      // Load saved onboarding data
      if (data.onboarding_data) {
        setOnboardingData(data.onboarding_data);
        
        // Restore form data from saved state
        if (data.onboarding_data.step1) {
          const step1 = data.onboarding_data.step1;
          setCafeName(step1.cafeName || '');
          setTimezone(step1.timezone || 'Asia/Kolkata');
          if (step1.openingHours) setOpeningHours(step1.openingHours);
          if (step1.logoPreview) setLogoPreview(step1.logoPreview);
        }
        
        if (data.onboarding_data.step2) {
          const step2 = data.onboarding_data.step2;
          setCurrency(step2.currency || 'INR');
          setCurrencySymbol(step2.currencySymbol || '₹');
          setIncludeTax(step2.includeTax || false);
          setTaxRate(step2.taxRate || 0);
          if (step2.enabledFeatures) setEnabledFeatures(step2.enabledFeatures);
        }
        
        if (data.onboarding_data.step3) {
          const step3 = data.onboarding_data.step3;
          setSkipTeamSetup(step3.skipTeamSetup || false);
          if (step3.teamMembers) setTeamMembers(step3.teamMembers);
        }
        
        if (data.onboarding_data.currentStep) {
          setCurrentStep(data.onboarding_data.currentStep);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      toast.error('Failed to load onboarding status');
      setLoading(false);
    }
  };

  const saveStep = async (stepNumber, stepData) => {
    try {
      await axios.put('/onboarding/step', {
        step: `step${stepNumber}`,
        data: stepData
      });
    } catch (error) {
      console.error('Error saving step:', error);
      // Check if migration is required
      if (error.response?.data?.code === 'MIGRATION_REQUIRED') {
        toast.error('Database migration required. Please contact your administrator.');
        return;
      }
      // Don't show error toast for auto-save (silent failures are OK)
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file size must be less than 5MB');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      // Save current step before moving
      await saveCurrentStep();
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveCurrentStep = async () => {
    let stepData = {};
    
    if (currentStep === 1) {
      stepData = {
        cafeName,
        timezone,
        openingHours,
        logoPreview
      };
    } else if (currentStep === 2) {
      stepData = {
        currency,
        currencySymbol,
        includeTax,
        taxRate,
        enabledFeatures
      };
    } else if (currentStep === 3) {
      stepData = {
        skipTeamSetup,
        teamMembers
      };
    }
    
    await saveStep(currentStep, stepData);
  };

  const handleComplete = async () => {
    setSaving(true);
    
    try {
      // Save final step
      await saveCurrentStep();
      
      // Complete onboarding
      await axios.post('/onboarding/complete');
      
      toast.success('Onboarding completed successfully!');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      
      // Check if migration is required
      if (error.response?.data?.code === 'MIGRATION_REQUIRED') {
        toast.error('Database migration required. Please contact your administrator.', {
          duration: 6000
        });
      } else {
        toast.error(error.response?.data?.error || 'Failed to complete onboarding');
      }
      
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return cafeName.trim().length > 0;
    }
    if (currentStep === 2) {
      return currency && currencySymbol;
    }
    if (currentStep === 3) {
      return true; // Team setup is optional
    }
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto mb-4"></div>
          <p className="text-secondary-600 dark:text-gray-400">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-700 dark:text-secondary-300 mb-2">
            Welcome!
          </h1>
          <p className="text-secondary-600 dark:text-gray-400">
            Let's set up your cafe in just a few steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      step < currentStep
                        ? 'bg-secondary-500 border-secondary-500 text-white'
                        : step === currentStep
                        ? 'border-secondary-500 bg-white dark:bg-gray-800 text-secondary-500'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold">{step}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      step <= currentStep
                        ? 'text-secondary-600 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {step === 1 && 'Basics'}
                    {step === 2 && 'Settings'}
                    {step === 3 && 'Team'}
                    {step === 4 && 'Review'}
                  </span>
                </div>
                {step < totalSteps && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      step < currentStep
                        ? 'bg-secondary-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 mb-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <Building2 className="h-6 w-6 text-secondary-500 mr-2" />
                <h2 className="text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                  Cafe Basics
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Cafe Name *
                </label>
                <input
                  type="text"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  className="w-full px-4 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter your cafe name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-contain rounded-lg border border-accent-200 dark:border-gray-700"
                    />
                  )}
                  <label className="flex items-center justify-center px-4 py-2 border border-accent-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-accent-50 dark:hover:bg-gray-700 transition-colors">
                    <Upload className="h-5 w-5 mr-2" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Recommended: Square image, max 5MB
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Timezone *
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Operating Hours
                </label>
                <div className="space-y-2">
                  {Object.entries(openingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) =>
                          setOpeningHours({
                            ...openingHours,
                            [day]: { ...hours, closed: !e.target.checked }
                          })
                        }
                        className="rounded"
                      />
                      <span className="w-24 text-sm font-medium capitalize">
                        {day}
                      </span>
                      {!hours.closed && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) =>
                              setOpeningHours({
                                ...openingHours,
                                [day]: { ...hours, open: e.target.value }
                              })
                            }
                            className="px-2 py-1 border border-accent-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) =>
                              setOpeningHours({
                                ...openingHours,
                                [day]: { ...hours, close: e.target.value }
                              })
                            }
                            className="px-2 py-1 border border-accent-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <Settings className="h-6 w-6 text-secondary-500 mr-2" />
                <h2 className="text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                  Initial Configuration
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Currency *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => {
                        setCurrency(curr.code);
                        setCurrencySymbol(curr.symbol);
                      }}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        currency === curr.code
                          ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300'
                          : 'border-accent-200 dark:border-gray-600 hover:border-secondary-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{curr.symbol}</div>
                      <div className="font-semibold">{curr.code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {curr.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeTax"
                  checked={includeTax}
                  onChange={(e) => setIncludeTax(e.target.checked)}
                  className="rounded"
                />
                <label
                  htmlFor="includeTax"
                  className="text-sm font-medium text-secondary-700 dark:text-gray-300"
                >
                  Include tax in prices
                </label>
              </div>

              {includeTax && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-accent-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  Enable Features
                </label>
                <div className="space-y-2">
                  {Object.entries(enabledFeatures).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) =>
                          setEnabledFeatures({
                            ...enabledFeatures,
                            [key]: e.target.checked
                          })
                        }
                        className="rounded"
                      />
                      <label
                        htmlFor={key}
                        className="text-sm text-secondary-700 dark:text-gray-300 capitalize"
                      >
                        {key.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <Users className="h-6 w-6 text-secondary-500 mr-2" />
                <h2 className="text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                  Team Setup
                </h2>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-accent-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  id="skipTeam"
                  checked={skipTeamSetup}
                  onChange={(e) => setSkipTeamSetup(e.target.checked)}
                  className="rounded"
                />
                <label
                  htmlFor="skipTeam"
                  className="text-sm font-medium text-secondary-700 dark:text-gray-300"
                >
                  Skip team setup for now (you can add team members later)
                </label>
              </div>

              {!skipTeamSetup && (
                <div className="space-y-4">
                  <p className="text-sm text-secondary-600 dark:text-gray-400">
                    You can invite team members later from the settings page.
                  </p>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 Tip: You can add team members after completing onboarding from the
                      admin dashboard.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <CheckSquare className="h-6 w-6 text-secondary-500 mr-2" />
                <h2 className="text-2xl font-semibold text-secondary-700 dark:text-secondary-300">
                  Review & Complete
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-accent-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                    Cafe Information
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">
                    <strong>Name:</strong> {cafeName}
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">
                    <strong>Timezone:</strong> {timezone}
                  </p>
                </div>

                <div className="p-4 bg-accent-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                    Configuration
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">
                    <strong>Currency:</strong> {currencySymbol} {currency}
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">
                    <strong>Tax:</strong> {includeTax ? `${taxRate}%` : 'Not included'}
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ You're all set! Click "Complete Onboarding" to finish setup and start
                    using your cafe management system.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 border border-accent-300 dark:border-gray-600 text-secondary-700 dark:text-gray-300 hover:bg-accent-50 dark:hover:bg-gray-700'
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                canProceed()
                  ? 'bg-secondary-500 hover:bg-secondary-600'
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving || !canProceed()}
              className={`flex items-center px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                canProceed() && !saving
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  Complete Onboarding
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CafeOnboarding;
