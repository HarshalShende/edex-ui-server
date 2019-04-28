/* AutoWhitelist class
	Maintains an automatically updating list of remote IP addresses that have an active socket with the current machine.
	Is used as a first line of defense to filter out connection attempts from rogue clients.
	Default refresh rate of the whitelist is 1000ms.
*/

class AutoWhitelist {
	constructor(interval) {
		const {networkConnections} = require('systeminformation');
		this.lookupConns = networkConnections;
		this.ipaddr = require('ipaddr.js');

		this.list = [];

		setInterval(this.updateWhitelist.bind(this), interval || 1000);
	}

	updateWhitelist() {
		this.lookupConns().then(conns => {
			conns.forEach(c => {
				const ip = c.peeraddress;
				if (c.state !== 'ESTABLISHED' || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::') {
					return;
				}

				if (this.list.indexOf(ip) === -1) {
					this.list.push(ip);
				}
			});
		});
	}

	async check(ip) {
		ip = this.ipaddr.parse(ip);

		if (ip.kind() === 'ipv6') {
			if (ip.isIPv4MappedAddress()) {
				ip = ip.toIPv4Address();
			} else {
				throw new Error('Could not parse IPv6 address');
			}
		}

		ip = ip.toString();

		if (ip.length < 7) {
			throw new Error('Detected IP address is too short');
		}

		if (this.list.indexOf(ip) !== -1) {
			return true;
		}

		return false;
	}
}

module.exports = AutoWhitelist;
