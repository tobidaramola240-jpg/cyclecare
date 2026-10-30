/**
 * SMS-BUS Virtual Hub — Standalone Web Application
 * 
 * Independent frontend platform for:
 * - Virtual phone number procurement (activations & rentals)
 * - Real-time live SMS reception with controlled 3.5s polling loop
 * - Customer wallet balance checks, fund reservation, and automatic deduction
 * - Idempotency protection and duplicate purchase prevention
 * - Multi-tenant customer isolation
 * - Resilient provider error and timeout handling
 */

(function () {
  const ReactObj = typeof React !== 'undefined' ? React : (typeof require !== 'undefined' ? (() => {
    try { return require('react'); } catch (e) {
      return { useState: (init) => [typeof init === 'function' ? init() : init, () => {}], useEffect: () => {}, createElement: () => null };
    }
  })() : {});
  const { useState, useEffect, createElement: h } = ReactObj;

  // ===== CUSTOMER IDENTITY & TENANCY =====
  function getOrCreateCustomerId() {
    try {
      let id = localStorage.getItem('smsbus_customer_id');
      if (!id) {
        id = 'cust_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        localStorage.setItem('smsbus_customer_id', id);
      }
      return id;
    } catch (e) {
      return 'cust_default_' + Date.now().toString(36);
    }
  }

  function SmsApp() {
    const [customerId, setCustomerId] = useState(getOrCreateCustomerId);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'new' | 'wallet' | 'history' | 'suppliers'
    const [activeOrder, setActiveOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // Customer Wallet & Ledger state
    const [customerWallet, setCustomerWallet] = useState(null);
    const [walletTransactions, setWalletTransactions] = useState([]);
    const [topupModalOpen, setTopupModalOpen] = useState(false);
    const [topupAmount, setTopupAmount] = useState('10.00');

    // Provider balance & info
    const [balanceData, setBalanceData] = useState(null);
    const [providersData, setProvidersData] = useState(null);

    // Live Polling & Timer state
    const [isPolling, setIsPolling] = useState(false);
    const [pollCount, setPollCount] = useState(0);
    const [pollError, setPollError] = useState(null);
    const [remainingSeconds, setRemainingSeconds] = useState(1200);
    const [copiedKey, setCopiedKey] = useState(null);

    // New Reservation Form State
    const [purchaseType, setPurchaseType] = useState('activation'); // 'activation' | 'rental'
    const [countries, setCountries] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('1');
    const [selectedService, setSelectedService] = useState('1');
    const [rentalDays, setRentalDays] = useState('30');
    const [pricesData, setPricesData] = useState(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState(null);

    // Customer Tenant Switcher Modal
    const [tenantModalOpen, setTenantModalOpen] = useState(false);
    const [customTenantInput, setCustomTenantInput] = useState(customerId);

    // In-app notifications
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    // Load customer-scoped orders
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const res = await fetch('/api/sms/orders', {
          headers: { 'x-customer-id': customerId },
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.orders || [];
          setOrders(list);

          setActiveOrder(current => {
            if (current) {
              const updated = list.find(o => o.id === current.id);
              return updated || current;
            }
            const pending = list.find(o => o.status === 'PENDING');
            return pending || list[0] || null;
          });
        }
      } catch (err) {
        console.warn('Failed to load orders:', err.message);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    // Load customer wallet balance and transactions
    const fetchCustomerWallet = async () => {
      try {
        const res = await fetch('/api/sms/wallet', {
          headers: { 'x-customer-id': customerId },
        });
        if (res.ok) {
          const data = await res.json();
          setCustomerWallet(data.wallet);
          setWalletTransactions(data.transactions || []);
        }
      } catch (e) {
        console.warn('Could not load wallet:', e.message);
      }
    };

    // Load upstream balance
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/sms/balance', {
          headers: { 'x-customer-id': customerId },
        });
        if (res.ok) {
          const data = await res.json();
          setBalanceData(data);
        }
      } catch (e) {}
    };

    // Load providers info
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/sms/providers', {
          headers: { 'x-customer-id': customerId },
        });
        if (res.ok) {
          const data = await res.json();
          setProvidersData(data);
        }
      } catch (e) {}
    };

    // Initial load
    useEffect(() => {
      fetchOrders();
      fetchCustomerWallet();
      fetchBalance();
      fetchProviders();

      fetch('/api/sms/countries', { headers: { 'x-customer-id': customerId } })
        .then(r => r.json())
        .then(d => { if (d.countries) setCountries(d.countries); })
        .catch(() => {});

      fetch('/api/sms/services', { headers: { 'x-customer-id': customerId } })
        .then(r => r.json())
        .then(d => { if (d.services) setServices(d.services); })
        .catch(() => {});
    }, [customerId]);

    // Query live prices when selectedCountry changes
    useEffect(() => {
      if (!selectedCountry) return;
      fetch('/api/sms/prices?countryId=' + encodeURIComponent(selectedCountry), {
        headers: { 'x-customer-id': customerId },
      })
        .then(r => r.json())
        .then(d => { if (d.prices) setPricesData(d.prices); })
        .catch(() => {});
    }, [selectedCountry, customerId]);

    // Live countdown timer for active 20-min activation window
    useEffect(() => {
      if (!activeOrder || activeOrder.status !== 'PENDING') {
        setRemainingSeconds(0);
        return;
      }

      const updateRemaining = () => {
        if (!activeOrder.expiresAt) return;
        const diffMs = new Date(activeOrder.expiresAt).getTime() - Date.now();
        const secs = Math.max(0, Math.floor(diffMs / 1000));
        setRemainingSeconds(secs);
        if (secs <= 0 && activeOrder.status === 'PENDING') {
          setActiveOrder(prev => prev ? { ...prev, status: 'EXPIRED' } : null);
          setIsPolling(false);
          addToast('Activation window expired (20 minutes).', 'warning');
        }
      };

      updateRemaining();
      const timer = setInterval(updateRemaining, 1000);
      return () => clearInterval(timer);
    }, [activeOrder && activeOrder.id, activeOrder && activeOrder.status, activeOrder && activeOrder.expiresAt]);

    // Live Controlled SMS Polling Engine (3.5s interval, stops on received/cancelled/expired)
    useEffect(() => {
      if (!activeOrder || activeOrder.status !== 'PENDING') {
        setIsPolling(false);
        return;
      }

      let isMounted = true;
      setIsPolling(true);
      setPollError(null);

      const endpoint = activeOrder.type === 'rental'
        ? '/api/sms/rent/' + encodeURIComponent(activeOrder.id) + '/sms'
        : '/api/sms/orders/' + encodeURIComponent(activeOrder.id) + '/sms';

      const pollSms = async () => {
        try {
          const res = await fetch(endpoint, {
            headers: { 'x-customer-id': customerId },
          });

          if (!isMounted) return;

          if (res.ok) {
            const data = await res.json();
            setPollCount(c => c + 1);
            setPollError(null);

            // 1. Terminal condition: SMS arrived
            if (data.hasSms && (data.code || data.text || (data.messages && data.messages.length > 0))) {
              const newMessages = (data.order && data.order.messages && data.order.messages.length > 0)
                ? data.order.messages
                : [{ code: data.code, text: data.text, receivedAt: new Date().toISOString() }];

              setActiveOrder(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  status: 'RECEIVED',
                  smsCode: data.code || prev.smsCode,
                  smsText: data.text || prev.smsText,
                  messages: newMessages,
                };
              });
              setIsPolling(false);
              addToast('🎉 Incoming SMS verification code received!', 'success');
              fetchOrders();
              return;
            }

            // 2. Terminal condition: Order status transitioned to CANCELLED or EXPIRED
            if (data.status === 'CANCELLED' || data.status === 'EXPIRED') {
              setActiveOrder(prev => prev ? { ...prev, status: data.status } : null);
              setIsPolling(false);
              return;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            setPollError(errData.error || ('Provider gateway status: ' + res.status));
          }
        } catch (netErr) {
          if (!isMounted) return;
          setPollError('Network drop: Upstream gateway retrying in 3.5s...');
        }
      };

      pollSms();
      const interval = setInterval(pollSms, 3500);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }, [activeOrder && activeOrder.id, activeOrder && activeOrder.status, customerId]);

    // 1-Click Clipboard Copy Handler with feedback
    const handleCopy = (text, key) => {
      if (!text) return;
      try {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(String(text));
        } else {
          const ta = document.createElement('textarea');
          ta.value = String(text);
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      } catch (e) {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      }
    };

    // Deposit / Top Up Wallet handler
    const handleTopup = async (customAmt) => {
      const amt = Number(customAmt || topupAmount);
      if (isNaN(amt) || amt <= 0) {
        alert('Please enter a valid top-up amount.');
        return;
      }
      try {
        const res = await fetch('/api/sms/wallet/topup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-customer-id': customerId,
          },
          body: JSON.stringify({
            amount: amt,
            description: 'Customer wallet deposit',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCustomerWallet(data);
          fetchCustomerWallet();
          setTopupModalOpen(false);
          addToast(`Successfully credited $${amt.toFixed(2)} to customer wallet!`, 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Failed to deposit funds.');
        }
      } catch (err) {
        alert('Network error while depositing funds.');
      }
    };

    // Cancel active reservation
    const handleCancelOrder = async () => {
      if (!activeOrder || activeOrder.status !== 'PENDING') return;
      if (!confirm('Cancel this reservation? Number will be released and funds refunded.')) return;

      const endpoint = activeOrder.type === 'rental'
        ? '/api/sms/rent/' + encodeURIComponent(activeOrder.id) + '/cancel'
        : '/api/sms/orders/' + encodeURIComponent(activeOrder.id) + '/cancel';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-customer-id': customerId,
          },
          body: JSON.stringify({ reason: 'Customer requested cancellation' }),
        });
        const data = await res.json();
        if (res.ok) {
          setActiveOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
          setIsPolling(false);
          addToast('Reservation cancelled. Funds refunded to wallet.', 'info');
          fetchOrders();
          fetchCustomerWallet();
        } else {
          alert(data.error || 'Failed to cancel order.');
        }
      } catch (err) {
        alert('Network error while cancelling order.');
      }
    };

    // Purchase / Reserve Number with Wallet Integration & Idempotency
    const handlePurchaseNumber = async () => {
      setIsPurchasing(true);
      setPurchaseError(null);

      // Unique idempotency key to prevent double charging
      const idempotencyKey = 'idemp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      const endpoint = purchaseType === 'rental' ? '/api/sms/rent' : '/api/sms/orders';
      const payload = purchaseType === 'rental'
        ? {
            countryId: Number(selectedCountry),
            serviceId: Number(selectedService) || null,
            days: Number(rentalDays) || 30,
            customerId,
            idempotencyKey,
          }
        : {
            countryId: Number(selectedCountry),
            serviceId: Number(selectedService),
            customerId,
            idempotencyKey,
          };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-customer-id': customerId,
            'x-idempotency-key': idempotencyKey,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.order) {
          setActiveOrder(data.order);
          setActiveTab('active');
          setPollCount(0);
          setPollError(null);
          fetchOrders();
          fetchCustomerWallet();
          fetchBalance();
          addToast(`Number ${data.number || data.order.number} reserved! Deducted $${Number(data.cost || 0.50).toFixed(2)} from wallet.`, 'success');
        } else if (res.status === 402) {
          setPurchaseError(data.error || 'Insufficient wallet balance. Please add funds.');
          setTopupModalOpen(true);
        } else {
          setPurchaseError(data.error || 'Could not reserve number. The service may be out of stock.');
        }
      } catch (err) {
        setPurchaseError('Network error connecting to SMS provider.');
      } finally {
        setIsPurchasing(false);
      }
    };

    const formatRemaining = (totalSec) => {
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return m + ':' + String(s).padStart(2, '0');
    };

    const formatTimestamp = (isoStr) => {
      if (!isoStr) return 'Just now';
      try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + d.toLocaleDateString();
      } catch (e) {
        return isoStr;
      }
    };

    const countryObj = countries.find(c => String(c.id) === String(activeOrder && activeOrder.countryId));
    const countryName = countryObj ? (countryObj.flag + ' ' + countryObj.name) : ('Country #' + (activeOrder ? activeOrder.countryId : ''));
    const serviceObj = services.find(s => String(s.id) === String(activeOrder && activeOrder.serviceId));
    const serviceName = serviceObj ? serviceObj.name : ('Service #' + (activeOrder ? activeOrder.serviceId : ''));

    const latestMsg = (activeOrder && activeOrder.messages && activeOrder.messages.length > 0)
      ? activeOrder.messages[activeOrder.messages.length - 1]
      : (activeOrder && activeOrder.smsText ? { text: activeOrder.smsText, code: activeOrder.smsCode, receivedAt: activeOrder.updatedAt } : null);

    return h('div', { className: 'min-h-screen flex flex-col bg-slate-950 text-slate-100' },

      // ===== TOP NAVIGATION BAR =====
      h('header', { className: 'sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between' },
        h('div', { className: 'flex items-center gap-3' },
          h('div', { className: 'w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950' },
            h('div', { className: 'w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-emerald-400 font-black text-lg' }, '⚡')
          ),
          h('div', null,
            h('div', { className: 'flex items-center gap-2' },
              h('h1', { className: 'text-lg font-black tracking-tight text-white' }, 'SMS-BUS Gateway'),
              h('span', { className: 'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' }, 'Live API')
            ),
            h('p', { className: 'text-xs text-slate-400' }, 'Independent Virtual Number & Real-Time SMS Reception Platform')
          )
        ),

        h('div', { className: 'flex items-center gap-2 sm:gap-3' },
          // Customer Wallet Balance widget with quick top-up
          h('div', {
            className: 'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-emerald-500/40 text-xs shadow-inner cursor-pointer hover:bg-slate-800 transition-all',
            onClick: () => setTopupModalOpen(true),
            title: 'Customer Wallet Balance (Click to Top Up)'
          },
            h('span', { className: 'text-emerald-400 font-bold' }, '💳'),
            h('span', { className: 'text-slate-300 font-medium hidden sm:inline' }, 'Wallet:'),
            h('span', { className: 'font-mono font-black text-emerald-400' }, '$' + (customerWallet ? customerWallet.available.toFixed(2) : '5.00')),
            h('button', {
              type: 'button',
              className: 'ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 text-[10px] font-extrabold transition-all'
            }, '+ Top Up')
          ),

          // Customer Tenant Selector
          h('button', {
            type: 'button',
            onClick: () => setTenantModalOpen(true),
            className: 'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer',
            title: 'Multi-tenant isolation: Click to switch customer ID'
          },
            h('span', { className: 'w-2 h-2 rounded-full bg-emerald-400' }),
            h('span', { className: 'hidden md:inline text-slate-400' }, 'Tenant:'),
            h('span', { className: 'font-mono text-emerald-300 font-bold' }, customerId.length > 15 ? customerId.slice(0, 14) + '...' : customerId),
            h('span', { className: 'text-slate-500 text-[10px]' }, '⚙️')
          )
        )
      ),

      // ===== TAB SELECTION BAR =====
      h('div', { className: 'bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3' },
        h('div', { className: 'flex flex-wrap gap-1.5 sm:gap-2' },
          h('button', {
            type: 'button',
            onClick: () => setActiveTab('active'),
            className: 'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (activeTab === 'active' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
          },
            h('span', null, '⚡ Live Reception'),
            (activeOrder && activeOrder.status === 'PENDING') && h('span', { className: 'w-2 h-2 rounded-full bg-slate-950 animate-ping' })
          ),

          h('button', {
            type: 'button',
            onClick: () => setActiveTab('new'),
            className: 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (activeTab === 'new' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
          }, '➕ Reserve Number'),

          h('button', {
            type: 'button',
            onClick: () => { setActiveTab('wallet'); fetchCustomerWallet(); },
            className: 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (activeTab === 'wallet' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
          }, '💳 Wallet & Billing'),

          h('button', {
            type: 'button',
            onClick: () => { setActiveTab('history'); fetchOrders(); },
            className: 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (activeTab === 'history' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
          }, '📜 Orders (' + orders.length + ')'),

          h('button', {
            type: 'button',
            onClick: () => setActiveTab('suppliers'),
            className: 'hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (activeTab === 'suppliers' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
          }, '🔌 Upstream API')
        ),

        // Live Provider Indicator
        h('div', { className: 'hidden lg:flex items-center gap-2 text-xs text-slate-400' },
          h('span', { className: 'w-2 h-2 rounded-full bg-emerald-400' }),
          h('span', null, 'Upstream: SMS-BUS REST API (https://sms-bus.com/docs)')
        )
      ),

      // ===== MAIN WORKSPACE =====
      h('main', { className: 'flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6' },

        // ===== TAB 1: LIVE RECEPTION =====
        activeTab === 'active' && (
          !activeOrder ? h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto my-12' },
            h('div', { className: 'w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl' }, '📥'),
            h('h2', { className: 'text-xl font-bold text-white' }, 'No Active Number Reservation'),
            h('p', { className: 'text-xs text-slate-400 leading-relaxed' },
              'Reserve a clean virtual phone number from SMS-BUS to receive your verification code or OTP in real-time. Charges are debited securely from your customer wallet.'
            ),
            h('button', {
              type: 'button',
              onClick: () => setActiveTab('new'),
              className: 'px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950 transition-all cursor-pointer'
            }, '＋ Reserve a Phone Number')
          ) : h('div', { className: 'space-y-6' },

            // Primary Phone Number Card
            h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4' },
              h('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4' },
                h('div', null,
                  h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1' }, 'Purchased Phone Number'),
                  h('div', { className: 'flex items-center gap-3' },
                    h('span', { className: 'text-2xl sm:text-4xl font-black font-mono tracking-tight text-white' }, activeOrder.number),
                    h('button', {
                      type: 'button',
                      onClick: () => handleCopy(activeOrder.number, 'number'),
                      className: 'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (copiedKey === 'number' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700')
                    }, copiedKey === 'number' ? '✓ Copied Number!' : '📋 Copy')
                  )
                ),

                // Status Pill
                h('div', { className: 'flex items-center gap-2' },
                  activeOrder.status === 'PENDING' && h('div', { className: 'flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs' },
                    h('span', { className: 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping' }),
                    'Waiting for SMS'
                  ),
                  activeOrder.status === 'RECEIVED' && h('div', { className: 'flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs' },
                    h('span', { className: 'font-black' }, '✓'),
                    'SMS Received'
                  ),
                  activeOrder.status === 'CANCELLED' && h('div', { className: 'px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs' },
                    '✕ Cancelled'
                  ),
                  activeOrder.status === 'EXPIRED' && h('div', { className: 'px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs' },
                    '⚠️ Expired'
                  )
                )
              ),

              // Badges row: Country, Service, Order Reference, Cost
              h('div', { className: 'pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2.5 text-xs' },
                h('span', { className: 'px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1.5' },
                  h('span', null, '🌍'),
                  h('span', null, countryName)
                ),
                h('span', { className: 'px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1.5' },
                  h('span', null, '📱'),
                  h('span', null, serviceName)
                ),
                h('button', {
                  type: 'button',
                  onClick: () => handleCopy(activeOrder.id, 'orderId'),
                  title: 'Click to copy order reference ID',
                  className: 'px-3 py-1.5 rounded-xl font-mono text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ' + (copiedKey === 'orderId' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-slate-200')
                },
                  h('span', null, '🔖 Ref:'),
                  h('span', null, activeOrder.id),
                  copiedKey === 'orderId' && h('span', { className: 'font-bold' }, '✓')
                ),
                h('span', { className: 'px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold' },
                  'Cost: $' + Number(activeOrder.cost || 0.50).toFixed(2)
                )
              )
            ),

            // Live Waiting Status Banner (when PENDING)
            activeOrder.status === 'PENDING' && h('div', { className: 'bg-amber-950/30 border border-amber-500/30 rounded-3xl p-6 space-y-3' },
              h('div', { className: 'flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-300' },
                h('div', { className: 'flex items-center gap-2.5' },
                  h('span', { className: 'w-3 h-3 rounded-full bg-amber-400 animate-pulse' }),
                  h('span', null, 'Controlled Polling Active · Checking upstream every 3.5s (Poll #' + pollCount + ')')
                ),
                h('div', { className: 'font-mono bg-amber-900/60 text-amber-200 px-3 py-1 rounded-xl border border-amber-700/50' },
                  '⏱️ ' + formatRemaining(remainingSeconds) + ' remaining'
                )
              ),
              h('p', { className: 'text-xs text-amber-200/80 leading-relaxed' },
                'Send your verification code to ' + activeOrder.number + '. This dashboard automatically retrieves and displays the SMS the instant it reaches the provider gateway.'
              ),
              pollError && h('div', { className: 'p-3 rounded-xl bg-amber-900/50 border border-amber-600/50 text-xs text-amber-200 flex items-center gap-2' },
                h('span', null, '⚡'),
                h('span', { className: 'font-semibold' }, pollError)
              )
            ),

            // Received Message Card
            (activeOrder.status === 'RECEIVED' || latestMsg) && h('div', { className: 'bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl' },
              h('div', { className: 'flex flex-wrap items-center justify-between gap-2' },
                h('div', { className: 'flex items-center gap-2 text-emerald-400 font-black text-base' },
                  h('span', { className: 'w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-sm font-black' }, '✓'),
                  h('span', null, 'Received Message')
                ),
                latestMsg && latestMsg.receivedAt && h('span', { className: 'text-xs text-slate-400 font-mono' },
                  '🕒 Received: ' + formatTimestamp(latestMsg.receivedAt)
                )
              ),

              // Highlighted OTP Box
              (latestMsg && latestMsg.code) && h('div', { className: 'p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4' },
                h('div', null,
                  h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1' }, 'Verification Code / One-Time Password'),
                  h('span', { className: 'text-4xl sm:text-5xl font-black font-mono tracking-widest text-emerald-300' }, latestMsg.code)
                ),
                h('button', {
                  type: 'button',
                  onClick: () => handleCopy(latestMsg.code, 'code'),
                  className: 'w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ' + (copiedKey === 'code' ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950')
                }, copiedKey === 'code' ? '✓ Copied Code!' : '📋 Copy Code')
              ),

              // Full SMS Body Text
              h('div', { className: 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5' },
                h('div', { className: 'flex items-center justify-between' },
                  h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-slate-400' }, 'Full Message Text'),
                  h('button', {
                    type: 'button',
                    onClick: () => handleCopy(latestMsg ? latestMsg.text : activeOrder.smsText, 'fullMsg'),
                    className: 'text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1'
                  }, copiedKey === 'fullMsg' ? '✓ Copied Message!' : '📋 Copy Full Message')
                ),
                h('p', { className: 'text-xs sm:text-sm text-slate-200 font-mono leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800 break-words' },
                  (latestMsg && latestMsg.text) ? latestMsg.text : 'SMS message received successfully from upstream carrier.'
                )
              )
            ),

            // Cancelled or Expired State Notice
            activeOrder.status === 'CANCELLED' && h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 text-xs text-slate-400 space-y-1' },
              h('div', { className: 'font-bold text-white text-sm' }, 'Order Cancelled'),
              h('p', null, 'This reservation has been cancelled. Polling has stopped and the number was released back to provider.')
            ),

            activeOrder.status === 'EXPIRED' && h('div', { className: 'bg-rose-950/30 border border-rose-500/30 rounded-3xl p-6 text-xs text-rose-300 space-y-1' },
              h('div', { className: 'font-bold text-rose-200 text-sm' }, 'Reservation Expired'),
              h('p', null, 'No message was received within the 20-minute active window. You can reserve a new clean number at any time.')
            ),

            // Bottom Actions Bar
            h('div', { className: 'pt-2 flex flex-wrap items-center justify-between gap-3' },
              activeOrder.status === 'PENDING' ? h('button', {
                type: 'button',
                onClick: handleCancelOrder,
                className: 'px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer'
              }, '🚫 Cancel & Refund Reservation') : h('div', null),

              h('div', { className: 'flex gap-2' },
                h('button', {
                  type: 'button',
                  onClick: fetchOrders,
                  className: 'px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer'
                }, '🔄 Refresh Status'),
                h('button', {
                  type: 'button',
                  onClick: () => setActiveTab('new'),
                  className: 'px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md transition-all cursor-pointer'
                }, '＋ Reserve Another Number')
              )
            )
          )
        ),

        // ===== TAB 2: RESERVE NEW NUMBER =====
        activeTab === 'new' && h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto' },
          h('div', null,
            h('h2', { className: 'text-xl font-bold text-white' }, 'Reserve a Virtual Phone Number'),
            h('p', { className: 'text-xs text-slate-400 mt-1' }, 'Instantly provision clean virtual numbers via the official SMS-BUS provider API.')
          ),

          // Activation vs Rental Mode Toggle
          h('div', { className: 'grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold' },
            h('button', {
              type: 'button',
              onClick: () => setPurchaseType('activation'),
              className: 'py-2.5 rounded-xl transition-all cursor-pointer ' + (purchaseType === 'activation' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white')
            }, '⚡ One-Time Activation (20 Min)'),
            h('button', {
              type: 'button',
              onClick: () => setPurchaseType('rental'),
              className: 'py-2.5 rounded-xl transition-all cursor-pointer ' + (purchaseType === 'rental' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white')
            }, '🗓️ Long-Term Rental (Days)')
          ),

          purchaseError && h('div', { className: 'p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-semibold space-y-2' },
            h('div', null, '⚠️ ' + purchaseError),
            purchaseError.includes('Insufficient') && h('button', {
              type: 'button',
              onClick: () => setTopupModalOpen(true),
              className: 'px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs'
            }, '💳 Top Up Wallet Now')
          ),

          // Country Selector
          h('div', { className: 'space-y-2' },
            h('label', { className: 'text-xs font-bold text-slate-300 block' }, 'Select Country:'),
            h('select', {
              value: selectedCountry,
              onChange: (e) => setSelectedCountry(e.target.value),
              className: 'w-full p-3 rounded-xl border border-slate-700 text-xs text-slate-100 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500'
            },
              countries.length === 0 ? h('option', { value: '1' }, '🇺🇸 United States (Default)') :
              countries.map(c => h('option', { key: c.id, value: c.id }, (c.flag || '🌍') + ' ' + c.name + ' (ID: ' + c.id + ')'))
            )
          ),

          // Service Selector
          h('div', { className: 'space-y-2' },
            h('label', { className: 'text-xs font-bold text-slate-300 block' }, 'Select Target Service:'),
            h('select', {
              value: selectedService,
              onChange: (e) => setSelectedService(e.target.value),
              className: 'w-full p-3 rounded-xl border border-slate-700 text-xs text-slate-100 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500'
            },
              services.length === 0 ? h('option', { value: '1' }, 'WhatsApp / Telegram / Google') :
              services.map(s => h('option', { key: s.id, value: s.id }, s.name + ' (ID: ' + s.id + ')'))
            )
          ),

          // Rental Duration (if rental mode)
          purchaseType === 'rental' && h('div', { className: 'space-y-2' },
            h('label', { className: 'text-xs font-bold text-slate-300 block' }, 'Rental Duration (Days):'),
            h('select', {
              value: rentalDays,
              onChange: (e) => setRentalDays(e.target.value),
              className: 'w-full p-3 rounded-xl border border-slate-700 text-xs text-slate-100 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500'
            },
              h('option', { value: '7' }, '7 Days'),
              h('option', { value: '14' }, '14 Days'),
              h('option', { value: '30' }, '30 Days (Standard)'),
              h('option', { value: '60' }, '60 Days'),
              h('option', { value: '90' }, '90 Days')
            )
          ),

          // Live Price, Stock & Wallet Balance Comparison Card
          h('div', { className: 'p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs' },
            h('div', { className: 'flex items-center justify-between text-slate-300' },
              h('div', { className: 'flex items-center gap-2' },
                h('span', null, '💰'),
                h('span', null, 'Current Provider Price:'),
                h('strong', { className: 'text-emerald-400 font-mono text-sm' }, pricesData && pricesData.cost ? ('$' + pricesData.cost) : '$0.50')
              ),
              h('div', { className: 'flex items-center gap-2' },
                h('span', null, '📦 Stock:'),
                h('span', { className: 'font-semibold text-emerald-400 font-mono' }, (pricesData && pricesData.count ? pricesData.count : 'Available') + ' numbers')
              )
            ),
            h('div', { className: 'pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400' },
              h('div', { className: 'flex items-center gap-2' },
                h('span', null, '💳'),
                h('span', null, 'Available Wallet Balance:'),
                h('span', { className: 'font-mono font-bold text-emerald-400' }, '$' + (customerWallet ? customerWallet.available.toFixed(2) : '5.00'))
              ),
              h('button', {
                type: 'button',
                onClick: () => setTopupModalOpen(true),
                className: 'text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer'
              }, '+ Add Funds')
            )
          ),

          // Submit Action
          h('div', { className: 'pt-2 flex justify-end gap-3' },
            h('button', {
              type: 'button',
              onClick: () => setActiveTab('active'),
              className: 'px-5 py-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all'
            }, 'Cancel'),
            h('button', {
              type: 'button',
              disabled: isPurchasing,
              onClick: handlePurchaseNumber,
              className: 'px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50'
            }, isPurchasing ? 'Reserving from Provider...' : '✓ Reserve Number Instantly')
          )
        ),

        // ===== TAB 3: CUSTOMER WALLET & BILLING LEDGER =====
        activeTab === 'wallet' && h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6' },
          h('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4' },
            h('div', null,
              h('h2', { className: 'text-xl font-bold text-white' }, 'Customer Wallet & Transaction Ledger'),
              h('p', { className: 'text-xs text-slate-400 mt-0.5' }, 'Multi-tenant isolated wallet for tenant: ' + customerId)
            ),
            h('button', {
              type: 'button',
              onClick: () => setTopupModalOpen(true),
              className: 'px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer'
            }, '💳 Top Up Wallet')
          ),

          // Balances Overview Cards
          h('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-4' },
            h('div', { className: 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1' },
              h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-slate-400' }, 'Available Balance'),
              h('div', { className: 'text-3xl font-black font-mono text-emerald-400' }, '$' + (customerWallet ? customerWallet.available.toFixed(2) : '5.00')),
              h('p', { className: 'text-[11px] text-slate-500' }, 'Ready for number purchases')
            ),

            h('div', { className: 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1' },
              h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-slate-400' }, 'Reserved In-Flight'),
              h('div', { className: 'text-3xl font-black font-mono text-amber-400' }, '$' + (customerWallet ? customerWallet.reserved.toFixed(2) : '0.00')),
              h('p', { className: 'text-[11px] text-slate-500' }, 'Held during provider provisioning')
            ),

            h('div', { className: 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1' },
              h('span', { className: 'text-[11px] font-bold uppercase tracking-wider text-slate-400' }, 'Total Credited'),
              h('div', { className: 'text-3xl font-black font-mono text-white' }, '$' + (customerWallet ? customerWallet.balance.toFixed(2) : '5.00')),
              h('p', { className: 'text-[11px] text-slate-500' }, 'Available + Reserved')
            )
          ),

          // Quick Deposit Buttons
          h('div', { className: 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3' },
            h('span', { className: 'text-xs font-bold text-slate-300 block' }, 'Quick Top-Up Demo Credits:'),
            h('div', { className: 'flex flex-wrap gap-2.5' },
              ['5.00', '10.00', '25.00', '50.00'].map(amt => h('button', {
                key: amt,
                type: 'button',
                onClick: () => handleTopup(amt),
                className: 'px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-300 transition-all cursor-pointer'
              }, `+$${amt}`))
            )
          ),

          // Complete Ledger History
          h('div', { className: 'space-y-3' },
            h('div', { className: 'flex items-center justify-between' },
              h('h3', { className: 'text-sm font-bold text-white' }, 'Transaction Audit Ledger (' + walletTransactions.length + ')'),
              h('button', {
                type: 'button',
                onClick: fetchCustomerWallet,
                className: 'text-xs text-emerald-400 hover:underline font-semibold'
              }, '🔄 Refresh Ledger')
            ),

            walletTransactions.length === 0 ? h('div', { className: 'text-center py-8 text-xs text-slate-500' },
              'No transactions recorded yet.'
            ) : h('div', { className: 'space-y-2' },
              walletTransactions.map(tx => {
                const isDebit = tx.type === 'PURCHASE_DEBIT';
                const isDeposit = tx.type === 'DEPOSIT';
                const isHold = tx.type === 'HOLD_RESERVED';
                const isRelease = tx.type === 'HOLD_RELEASED';

                return h('div', {
                  key: tx.id,
                  className: 'p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs'
                },
                  h('div', { className: 'space-y-0.5' },
                    h('div', { className: 'flex items-center gap-2' },
                      h('span', {
                        className: 'font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ' +
                          (isDebit ? 'bg-rose-500/20 text-rose-300' :
                           isDeposit ? 'bg-emerald-500/20 text-emerald-300' :
                           isHold ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300')
                      }, tx.type),
                      h('span', { className: 'font-semibold text-slate-200' }, tx.description || tx.referenceId)
                    ),
                    h('div', { className: 'text-[11px] text-slate-500 font-mono' },
                      formatTimestamp(tx.timestamp) + ' · Ref: ' + (tx.referenceId || tx.id)
                    )
                  ),

                  h('div', { className: 'text-right' },
                    h('div', {
                      className: 'font-mono font-bold text-sm ' +
                        (isDebit ? 'text-rose-400' : isDeposit ? 'text-emerald-400' : 'text-slate-300')
                    }, (isDebit ? '-' : isDeposit ? '+' : '') + '$' + Number(tx.amount).toFixed(2)),
                    h('div', { className: 'text-[10px] text-slate-500 font-mono' },
                      'Bal: $' + Number(tx.balanceAfter).toFixed(2)
                    )
                  )
                );
              })
            )
          )
        ),

        // ===== TAB 4: ORDER HISTORY =====
        activeTab === 'history' && h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5' },
          h('div', { className: 'flex items-center justify-between' },
            h('div', null,
              h('h2', { className: 'text-xl font-bold text-white' }, 'Order History & Inbound SMS Logs'),
              h('p', { className: 'text-xs text-slate-400' }, 'Displaying all phone numbers and inbound messages scoped to tenant: ' + customerId)
            ),
            h('button', {
              type: 'button',
              onClick: fetchOrders,
              className: 'px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all'
            }, '🔄 Refresh')
          ),

          orders.length === 0 ? h('div', { className: 'text-center py-12 text-xs text-slate-500' },
            'No previous reservations recorded for this customer account.'
          ) : h('div', { className: 'space-y-3' },
            orders.map(ord => {
              const isSelected = activeOrder && activeOrder.id === ord.id;
              return h('div', {
                key: ord.id,
                onClick: () => { setActiveOrder(ord); setActiveTab('active'); },
                className: 'p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ' + (isSelected ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg' : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800')
              },
                h('div', { className: 'space-y-1' },
                  h('div', { className: 'flex items-center gap-2.5' },
                    h('span', { className: 'font-mono font-black text-sm text-white' }, ord.number),
                    isSelected && h('span', { className: 'text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full' }, 'Viewing'),
                    h('span', { className: 'text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-md' }, ord.type || 'activation')
                  ),
                  h('div', { className: 'text-[11px] text-slate-400 flex items-center gap-2' },
                    h('span', null, 'Ref: ' + ord.id),
                    h('span', null, '·'),
                    h('span', null, formatTimestamp(ord.createdAt))
                  )
                ),

                h('div', { className: 'flex items-center gap-3' },
                  ord.smsCode && h('div', { className: 'px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs' },
                    'Code: ' + ord.smsCode
                  ),
                  ord.status === 'RECEIVED' && h('span', { className: 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' }, '✓ Received'),
                  ord.status === 'PENDING' && h('span', { className: 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' }, '⏳ Waiting'),
                  ord.status === 'CANCELLED' && h('span', { className: 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700' }, '✕ Cancelled'),
                  ord.status === 'EXPIRED' && h('span', { className: 'text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30' }, '⚠️ Expired')
                )
              );
            })
          )
        ),

        // ===== TAB 5: UPSTREAM SUPPLIERS & API =====
        activeTab === 'suppliers' && h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6' },
          h('div', null,
            h('h2', { className: 'text-xl font-bold text-white' }, 'Upstream SMS Provider Architecture'),
            h('p', { className: 'text-xs text-slate-400 mt-1' }, 'Configurable provider registry supporting official SMS-BUS and extensible third-party suppliers.')
          ),

          h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
            h('div', { className: 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3' },
              h('div', { className: 'flex items-center justify-between' },
                h('div', { className: 'flex items-center gap-2' },
                  h('span', { className: 'text-lg' }, '📡'),
                  h('h3', { className: 'font-bold text-white text-sm' }, 'SMS-BUS (Primary Adapter)')
                ),
                h('span', { className: 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' }, 'ACTIVE')
              ),
              h('p', { className: 'text-xs text-slate-400' }, 'Official upstream integration via https://sms-bus.com/docs. Strict production mode prevents mock data.'),
              h('div', { className: 'text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800 space-y-1' },
                h('div', null, '• Base URL: https://sms-bus.com/api/control'),
                h('div', null, '• Token Security: Server-side environment (never exposed)'),
                h('div', null, '• Rental API: https://sms-bus.com/docs/rent')
              )
            ),

            h('div', { className: 'p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3' },
              h('div', { className: 'flex items-center justify-between' },
                h('div', { className: 'flex items-center gap-2' },
                  h('span', { className: 'text-lg' }, '🔌'),
                  h('h3', { className: 'font-bold text-white text-sm' }, 'Extensible Multi-Provider')
                ),
                h('span', { className: 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700' }, 'CONFIGURABLE')
              ),
              h('p', { className: 'text-xs text-slate-400' }, 'Unified BaseSmsProvider interface allows adding secondary authorized SMS suppliers seamlessly.'),
              h('div', { className: 'text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800 space-y-1' },
                h('div', null, '• Dynamic routing by providerId'),
                h('div', null, '• Standardized error code normalizer'),
                h('div', null, '• Universal order store & error auditing')
              )
            )
          )
        )
      ),

      // ===== TOP UP WALLET MODAL =====
      topupModalOpen && h('div', { className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm' },
        h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl' },
          h('div', { className: 'flex items-center justify-between' },
            h('div', { className: 'flex items-center gap-2' },
              h('span', { className: 'text-lg' }, '💳'),
              h('h3', { className: 'text-base font-bold text-white' }, 'Top Up Customer Wallet')
            ),
            h('button', { onClick: () => setTopupModalOpen(false), className: 'text-slate-400 hover:text-white' }, '✕')
          ),
          h('p', { className: 'text-xs text-slate-400' },
            'Deposit funds into your customer account to reserve numbers and receive live verification SMS.'
          ),
          h('div', { className: 'space-y-1.5' },
            h('label', { className: 'text-xs font-bold text-slate-300 block' }, 'Select or Enter Amount ($ USD):'),
            h('div', { className: 'flex gap-2 mb-2' },
              ['5.00', '10.00', '25.00'].map(amt => h('button', {
                key: amt,
                type: 'button',
                onClick: () => setTopupAmount(amt),
                className: 'flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ' +
                  (topupAmount === amt ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800')
              }, `$${amt}`))
            ),
            h('input', {
              type: 'number',
              step: '0.50',
              value: topupAmount,
              onChange: (e) => setTopupAmount(e.target.value),
              className: 'w-full p-2.5 rounded-xl border border-slate-700 text-sm font-mono text-emerald-300 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500'
            })
          ),
          h('div', { className: 'pt-2 flex justify-end gap-2' },
            h('button', {
              type: 'button',
              onClick: () => setTopupModalOpen(false),
              className: 'px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800'
            }, 'Cancel'),
            h('button', {
              type: 'button',
              onClick: () => handleTopup(topupAmount),
              className: 'px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs'
            }, `✓ Credit $${Number(topupAmount || 0).toFixed(2)}`)
          )
        )
      ),

      // ===== CUSTOMER TENANT MODAL =====
      tenantModalOpen && h('div', { className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm' },
        h('div', { className: 'bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl' },
          h('div', { className: 'flex items-center justify-between' },
            h('h3', { className: 'text-base font-bold text-white' }, 'Customer Tenant Isolation'),
            h('button', { onClick: () => setTenantModalOpen(false), className: 'text-slate-400 hover:text-white' }, '✕')
          ),
          h('p', { className: 'text-xs text-slate-400' },
            'Each customer has an isolated wallet and message partition. Other customers cannot view, poll, or cancel orders that do not belong to them.'
          ),
          h('div', { className: 'space-y-1.5' },
            h('label', { className: 'text-xs font-bold text-slate-300 block' }, 'Current Customer Identifier:'),
            h('input', {
              type: 'text',
              value: customTenantInput,
              onChange: (e) => setCustomTenantInput(e.target.value),
              className: 'w-full p-2.5 rounded-xl border border-slate-700 text-xs font-mono text-emerald-300 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500'
            })
          ),
          h('div', { className: 'pt-2 flex justify-end gap-2' },
            h('button', {
              type: 'button',
              onClick: () => {
                const newId = 'cust_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
                setCustomTenantInput(newId);
              },
              className: 'px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold'
            }, 'Generate Random'),
            h('button', {
              type: 'button',
              onClick: () => {
                const finalId = customTenantInput.trim() || 'cust_default';
                setCustomerId(finalId);
                try { localStorage.setItem('smsbus_customer_id', finalId); } catch (e) {}
                setTenantModalOpen(false);
                addToast('Switched to customer tenant: ' + finalId, 'info');
              },
              className: 'px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs'
            }, 'Save Tenant')
          )
        )
      ),

      // ===== TOASTS CONTAINER =====
      h('div', { className: 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none' },
        toasts.map(t => h('div', {
          key: t.id,
          className: 'pointer-events-auto px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 ' +
            (t.type === 'success' ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200' :
             t.type === 'warning' ? 'bg-amber-950 border-amber-500/50 text-amber-200' :
             'bg-slate-900 border-slate-700 text-slate-200')
        },
          h('span', null, t.type === 'success' ? '✓' : t.type === 'warning' ? '⚠️' : 'ℹ️'),
          h('span', null, t.message)
        ))
      )
    );
  }

  // Mount Application to root
  if (typeof document !== 'undefined') {
    const rootEl = document.getElementById('sms-app-root');
    if (rootEl && ReactDOM) {
      const root = ReactDOM.createRoot(rootEl);
      root.render(h(React.StrictMode, null, h(SmsApp)));
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getOrCreateCustomerId,
      SmsApp,
    };
  }
})();
