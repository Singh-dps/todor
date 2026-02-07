import https from 'https';

// Hardcoded reliable list + some others
const candidates = [
    'inv.tux.pizza',
    'vid.puffyan.us',
    'invidious.protokolla.fi',
    'invidious.flokinet.to',
    'yt.artemislena.eu',
    'invidious.projectsegfau.lt',
    'invidious.privacydev.net',
    'iv.ggtyler.dev',
    'invidious.lunar.icu',
    'invidious.drgns.space',
    'invidious.nerdvpn.de',
    'inv.bp.projectsegfau.lt',
    'yewtu.be',
    'invidious.io.lol',
    'invidious.tyil.nl',
    'invidious.snopyta.org',
    'invidious.kavin.rocks',
    'inv.nadeko.net',
    'invidious.jing.rocks',
    'invidious.einfachzocken.eu',
    'yt.cdaut.de',
    'invidious.perennialteks.com',
    'invidious.fdn.fr'
];

console.log(`Testing ${candidates.length} candidates via allorigins proxy...`);

const checkInstance = (domain) => {
    return new Promise((resolve) => {
        // We check the stats endpoint via proxy
        const targetUrl = `https://${domain}/api/v1/stats`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        // allorigins usually returns 200 even if target fails? No, /raw returns target status usually.
        // Let's check.

        const req = https.get(proxyUrl, { timeout: 10000 }, (res) => {
            if (res.statusCode === 200) {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        // Verify it is Invidious
                        if (json.software && json.software.name === 'invidious') {
                            // Check playlist via proxy
                            const plTarget = `https://${domain}/api/v1/playlists/PL4cUxeGkcC9l0Jnx0_oMEa_J8v_z_yD5E?fields=title`;
                            const plProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(plTarget)}`;

                            https.get(plProxy, { timeout: 10000 }, (plRes) => {
                                if (plRes.statusCode === 200) {
                                    resolve({ domain, working: true, users: json.usage?.users?.total || 0 });
                                } else {
                                    resolve({ domain, working: false, error: `Playlist ${plRes.statusCode}` });
                                }
                            }).on('error', () => resolve({ domain, working: false, error: 'Playlist Error' }));
                        } else {
                            resolve({ domain, working: false, error: 'Not Invidious' });
                        }
                    } catch (e) {
                        resolve({ domain, working: false, error: 'Invalid JSON' });
                    }
                });
            } else {
                resolve({ domain, working: false, status: res.statusCode });
            }
        });

        req.on('error', (e) => resolve({ domain, working: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ domain, working: false, error: 'Timeout' }); });
    });
};

(async () => {
    // Run all checks
    const results = await Promise.all(candidates.map(checkInstance));

    const working = results.filter(r => r.working).sort((a, b) => b.users - a.users);

    console.log('\nWorking Invidious Instances (via allorigins):');
    working.forEach(w => console.log(`- https://${w.domain} (Users: ${w.users})`));

    if (working.length === 0) {
        console.log('\nNo working instances via proxy found.');
    }
})();
