import { validate, snapshot } from './model.js';

let ready;

function storageError(error) {
  if (error?.name === 'QuotaExceededError') return new Error('O navegador ficou sem espaço. Reduza o tamanho das fotos e tente novamente.');
  return new Error('Não foi possível salvar os dados neste navegador. Verifique se o armazenamento local está permitido.');
}

function transaction(db, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cars', mode);
    const request = action(tx.objectStore('cars'));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = tx.onabort = () => reject(storageError(tx.error));
  });
}

async function database() {
  if (!ready) {
    ready = (async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('patio-preview', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('cars', { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(storageError(request.error));
        request.onblocked = () => reject(new Error('Feche outras abas antigas do painel e tente novamente.'));
      });
      db.onversionchange = () => { db.close(); ready = undefined; };

      // Keep the old small-text data as a backup; never overwrite newer records.
      let legacy;
      try { legacy = JSON.parse(localStorage.getItem('patio-preview') || '[]'); }
      catch { legacy = []; }
      if (Array.isArray(legacy) && legacy.length) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('cars', 'readwrite'), store = tx.objectStore('cars');
          for (const car of legacy) {
            if (!car || typeof car.id !== 'string' || !car.id) continue;
            const request = store.get(car.id);
            request.onsuccess = () => { if (!request.result) store.put(car); };
          }
          tx.oncomplete = resolve;
          tx.onerror = tx.onabort = () => reject(storageError(tx.error));
        });
      }
      return db;
    })().catch(error => { ready = undefined; throw error; });
  }
  return ready;
}

export async function listPreviewCars() {
  return transaction(await database(), 'readonly', store => store.getAll());
}

export async function savePreviewCar(car) {
  validate(car);
  const db=await database(),old=car.id?await transaction(db,'readonly',store=>store.get(car.id)):null;
  const reset=old&&JSON.stringify(snapshot(old))!==JSON.stringify(snapshot(car))&&!['published','sale_pending','sold'].includes(old.status);
  const saved = { ...car, id: car.id || crypto.randomUUID(), status: reset?'draft':car.status || 'draft', updated: Date.now(),...(reset?{result:null,remote:false,jobId:null,tabId:null,phase:'',report:''}:{}) };
  await transaction(db, 'readwrite', store => store.put(saved));
  return saved;
}
