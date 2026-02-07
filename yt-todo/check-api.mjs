import https from 'https';

const instances = [
    // Piped
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.syncpundit.io',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.lunar.icu',
    'https://pipedapi.rivo.lol',
    'https://pipedapi.drgns.space',
    'https://piapi.ggtyler.dev',
    'https://pipedapi.nosebs.ru',
    'https://pipedapi.adminforge.de',
    'https://api.piped.privacydev.net',
    'https://pipedapi.smnz.de',
    'https://pipedapi.qdi.fi',
    'https://piped-api.hostux.net',
    'https://pipedapi.ducks.party',

    // Invidious (different endpoint structure, but checking help)
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.protokolla.fi',
    'https://invidious.flokinet.to',
    'https://yt.artemislena.eu',
    'https://invidious.projectsegfau.lt',
    'https://invidious.privacydev.net'
];

const checkInstance = (base) => {
    return new Promise((resolve) => {
        // Check Piped playlist endpoint
        const isInvidious = !base.includes('piped');
        const url = isInvidious
            ? `${base}/api/v1/playlists/PL4cUxeGkcC9l0Jnx0_oMEa_J8v_z_yD5E`
            : `${base}/playlists/PL4cUxeGkcC9l0Jnx0_oMEa_J8v_z_yD5E`;

        const req = https.get(url, { timeout: 5000 }, (res) => {
            if (res.statusCode === 200) {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        // Basic validation
                        if (isInvidious) {
                            if (json.title) resolve({ base, type: 'invidious', working: true });
                            else resolve({ base, working: false, error: 'Invalid Invidious JSON' });
                        } else {
                            if (json.name || json.title) resolve({ base, type: 'piped', working: true });
                            else resolve({ base, working: false, error: 'Invalid Piped JSON' });
                        }
                    } catch (e) {
                        resolve({ base, working: false, error: 'Invalid JSON' });
                    }
                });
            } else {
                resolve({ base, working: false, status: res.statusCode });
            }
        });

        req.on('error', (e) => resolve({ base, working: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ base, working: false, error: 'Timeout' }); });
    });
};

(async () => {
    console.log('Checking instances...');
    const results = await Promise.all(instances.map(checkInstance));
    const working = results.filter(r => r.working);

    console.log('\nWorking Instances:');
    working.forEach(w => console.log(`- ${w.base} (${w.type})`));

    if (working.length === 0) {
        console.log('\nNo working instances found.');
        // Print errors for debugging
        // results.forEach(r => console.log(`${r.base}: ${r.error || r.status}`));
    }
})();
