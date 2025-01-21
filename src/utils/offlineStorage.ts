import { openDB, DBSchema } from 'idb';
import { Note } from '@/types/note';

interface NotesDB extends DBSchema {
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-created': Date };
  };
}

const DB_NAME = 'notesOfflineDB';
const STORE_NAME = 'notes';

export const initDB = async () => {
  const db = await openDB<NotesDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'id'
      });
      store.createIndex('by-created', 'created_at');
    },
  });
  return db;
};

export const saveNotesToOfflineStorage = async (notes: Note[]) => {
  console.log('Saving notes to offline storage:', notes.length);
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  
  await Promise.all([
    ...notes.map(note => tx.store.put(note)),
    tx.done
  ]);
};

export const getOfflineNotes = async (): Promise<Note[]> => {
  console.log('Fetching notes from offline storage');
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-created');
};