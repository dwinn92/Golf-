(function () {
  const KEY = '__mock_db_store';
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
  const listeners = {};
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  const coll = n => (store[n] || (store[n] = {}));
  const snapOf = (name, order, dir, lim) => {
    let docs = Object.entries(coll(name)).map(([id, data]) => ({
      id, exists: true, data: () => data, metadata: { fromCache: false, hasPendingWrites: false }
    }));
    if (order) docs.sort((a, b) => {
      const av = a.data()[order], bv = b.data()[order];
      const c = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === 'desc' ? -c : c;
    });
    if (lim) docs = docs.slice(0, lim);
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [],
             metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const notify = name => (listeners[name] || []).forEach(fn => fn());
  const makeDoc = (name, id) => ({
    id, path: name + '/' + id,
    get: async () => ({ id, exists: id in coll(name), data: () => coll(name)[id], metadata: {} }),
    set: async (data) => {
      if (window.__mockFailWrites) throw { code: 'unavailable', message: 'offline' };
      coll(name)[id] = JSON.parse(JSON.stringify(data)); persist(); notify(name);
    },
    update: async (data) => {
      if (window.__mockFailWrites) throw { code: 'unavailable', message: 'offline' };
      Object.assign(coll(name)[id], data); persist(); notify(name);
    },
    delete: async () => { delete coll(name)[id]; persist(); notify(name); },
    onSnapshot: (fn) => { setTimeout(() => fn({ id, exists: id in coll(name), data: () => coll(name)[id], metadata: {} }), 0); return () => {}; },
    collection: (p) => makeQuery(name + '/' + id + '/' + p)
  });
  const makeQuery = (name, order, dir, lim) => ({
    orderBy: (f, d) => makeQuery(name, f, d, lim),
    limit: n => makeQuery(name, order, dir, n),
    where: () => makeQuery(name, order, dir, lim),
    get: async () => snapOf(name, order, dir, lim),
    onSnapshot: (fn) => {
      const emit = () => fn(snapOf(name, order, dir, lim));
      (listeners[name] || (listeners[name] = [])).push(emit);
      setTimeout(emit, 0);
      return () => {};
    },
    doc: (id) => makeDoc(name, id || ('auto-' + Math.random().toString(36).slice(2))),
    add: async (data) => { const d = makeDoc(name); await d.set(data); return d; },
    path: name
  });
  window.__mockStore = store;
  window.__mockPersist = persist;
  window.__mockNotifyAll = () => { persist(); Object.keys(listeners).forEach(notify); };
  window.claude = {
    use: async (cap) => {
      if (cap === 'db') return {
        doc: p => { const i = p.lastIndexOf('/'); return makeDoc(p.slice(0, i), p.slice(i + 1)); },
        collection: makeQuery
      };
      if (cap === 'downloads') return { save: async () => ({ status: 'saved' }) };
      return null;
    }
  };
})();
