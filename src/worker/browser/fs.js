const { openDB } = require('idb');

const getDB = () => openDB('/data', 21);

const getDataKeyAndMode = async (db) => {
  const dummy = await db.get('FILE_DATA', '/data/.DUMMY');
  const dataKey = Object.keys(dummy).filter((k) => !['mode', 'timestamp'].includes(k)).pop();
  return { dataKey, mode: dummy.mode };
};

module.exports = {
  readFile: async (path) => {
    const db = await getDB();
    const { dataKey } = await getDataKeyAndMode(db);
    return (await db.get('FILE_DATA', `/data/${path}`))[dataKey];
  },
  writeFile: async (path, data) => {
    const db = await getDB();
    const { dataKey, mode } = await getDataKeyAndMode(db);
    await db.put(
      'FILE_DATA',
      {
        [dataKey]: data,
        mode,
        timestamp: new Date(),
      },
      `/data/${path}`,
    );
  },
  deleteFile: async (path) => {
    const db = await getDB();
    await db.delete('FILE_DATA', `/data/${path}`);
  },
};
