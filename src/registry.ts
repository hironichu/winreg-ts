import { $ } from './deps.ts'
import Options from './types/options.ts';
import RegistryItem from './types/RegistryItem.ts'
import ProcessUncleanExitError from './error.ts'
import { RegistryItemImpl } from './types/RegistryItemImpl.ts'

import {	mkErrorMsg,
	pushArch,
	getRegExePath,
} from './util/util.ts'

export const HKLM          = 'HKLM'
export const HKCU          = 'HKCU'
export const HKCR          = 'HKCR'
export const HKU           = 'HKU'
export const HKCC          = 'HKCC'
export const HIVES         = [ HKLM, HKCU, HKCR, HKU, HKCC ]
export const REG_SZ        = 'REG_SZ'
export const REG_MULTI_SZ  = 'REG_MULTI_SZ'
export const REG_EXPAND_SZ = 'REG_EXPAND_SZ'
export const REG_DWORD     = 'REG_DWORD'
export const REG_QWORD     = 'REG_QWORD'
export const REG_BINARY    = 'REG_BINARY'
export const REG_NONE      = 'REG_NONE'
export const REG_TYPES     = [ REG_SZ, REG_MULTI_SZ, REG_EXPAND_SZ, REG_DWORD, REG_QWORD, REG_BINARY, REG_NONE ]
export const DEFAULT_VALUE = ''
export const KEY_PATTERN   = /(\\[a-zA-Z0-9_\s]+)*/
export const PATH_PATTERN  = /^(HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG)(.*)$/
export const ITEM_PATTERN  = /^(.*)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/
export const ARCH_X86 = 'x86'
export const ARCH_X64 = 'x64'
export const ARCHS = [ ARCH_X86, ARCH_X64 ]

export /* default */ class Registry {
	/* private members */
	/** @internal */
	private _host: string    // hostname
	/** @internal */
	private _hive: string;     // registry hive
	/** @internal */
	private _key: string     // registry key
	/** @internal */
	private _arch: string | null    // hive architecture
	/** @internal */
	private _utf8: boolean   // utf8 flag

	constructor(options?: Options) {
		console.info('[registry] Registry constructor')
		const _options = options || {};
		this._host = '' + (_options.host || '')    // hostname
		this._hive = (_options.hive || HKLM)  // registry hive
		this._key  = '' + (_options.key  || '')    // registry key
		this._arch = _options.arch || null         // hive architecture
		this._utf8 = _options.utf8 || false        // utf8 flag

		// validate options...
		if (HIVES.indexOf(this._hive) == -1) {
			throw new Error('illegal hive specified.');
		}

		if (!KEY_PATTERN.test(this._key)) {
			throw new Error('illegal key specified.');
		}

		if (this._arch && ARCHS.indexOf(this._arch) == -1) {
			throw new Error('illegal architecture specified (use x86 or x64)');
		}
	}

	/* getters/setters */

	/**
	 * The hostname.
	 * @readonly
	 * @member {string} Registry#host
	 */
	get host(): string {
		return this._host;
	}

	/**
	 * The hive id.
	 * @readonly
	 * @member {string} Registry#hive
	 */
	get hive(): string {
		return this._hive;
	}

	/**
	 * The registry key.
	 * @readonly
	 * @member {string} Registry#key
	 */
	get key(): string {
		return this._key;
	}

	/**
	 * The full path to the registry key.
	 * @readonly
	 * @member {string} Registry#path
	 */
	get path(): string {
		return (this._host.length == 0 ? '' : '\\\\' + this._host + '\\') + this._hive + this._key;
	}

	/**
	 * The registry hive architecture ('x86' or 'x64').
	 * @readonly
	 * @member {string} Registry#arch
	 */
	get arch(): string | null {
		return this._arch;
	}

	/**
	 * The flag of whether to decode via utf-8.
	 * @readonly
	 * @member {boolean} Registry#utf8
	 */
	get utf8(): boolean {
		return this._utf8;
	}

	/**
	 * Creates a new {@link Registry} instance that points to the parent registry key.
	 * @readonly
	 * @member {Registry} Registry#parent
	 */
	get parent(): Registry {
		const i = this._key.lastIndexOf('\\')
		return new Registry({
			host: this.host,
			hive: this.hive,
			key:  (i == -1) ? '' : this._key.substring(0, i),
			arch: this.arch!,
			utf8: this.utf8,
		});
	}

	/**
	 * Registry hive key HKEY_LOCAL_MACHINE.
	 * Note: For writing to this hive your program has to run with admin privileges.
	 * @type {string}
	 */
	static readonly HKLM = HKLM;

	/**
	 * Registry hive key HKEY_CURRENT_USER.
	 * @type {string}
	 */
	static readonly HKCU = HKCU;

	/**
	 * Registry hive key HKEY_CLASSES_ROOT.
	 * Note: For writing to this hive your program has to run with admin privileges.
	 * @type {string}
	 */
	static readonly HKCR = HKCR;

	/**
	 * Registry hive key HKEY_USERS.
	 * Note: For writing to this hive your program has to run with admin privileges.
	 * @type {string}
	 */
	static readonly HKU = HKU;

	/**
	 * Registry hive key HKEY_CURRENT_CONFIG.
	 * Note: For writing to this hive your program has to run with admin privileges.
	 * @type {string}
	 */
	static readonly HKCC = HKCC;

	/**
	 * Collection of available registry hive keys.
	 * @type {array}
	 */
	static readonly HIVES = HIVES;

	/**
	 * Registry value type STRING.
	 * @type {string}
	 */
	static readonly REG_SZ = REG_SZ;

	/**
	 * Registry value type MULTILINE_STRING.
	 * @type {string}
	 */
	static readonly REG_MULTI_SZ = REG_MULTI_SZ;

	/**
	 * Registry value type EXPANDABLE_STRING.
	 * @type {string}
	 */
	static readonly REG_EXPAND_SZ = REG_EXPAND_SZ;
		
	/**
	 * Registry value type DOUBLE_WORD.
	 * @type {string}
	 */
	static readonly REG_DWORD = REG_DWORD;
		
	/**
	 * Registry value type QUAD_WORD.
	 * @type {string}
	 */
	static readonly REG_QWORD = REG_QWORD;

	/**
	 * Registry value type BINARY.
	 * @type {string}
	 */
	static readonly REG_BINARY = REG_BINARY;

	/**
	 * Registry value type UNKNOWN.
	 * @type {string}
	 */
	static readonly REG_NONE = REG_NONE;

	/**
	 * Collection of available registry value types.
	 * @type {array}
	 */
	static readonly REG_TYPES = REG_TYPES;

	/**
	 * The name of the default value. May be used instead of the empty string literal for better readability.
	 * @type {string}
	 */
	static readonly DEFAULT_VALUE = DEFAULT_VALUE;

	/**
	 * Retrieve all values from this registry key.
	 * @param {valuesCallback} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @param {array=} cb.items - an array of {@link RegistryItem} objects
	 * @returns {Registry} this registry key object
	 */
	values(cb: (err: Error | null, items?: RegistryItem[]) => void): this {

		if (typeof cb !== 'function') throw new TypeError('must specify a callback');

		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		const args = [ 'QUERY', pathArg];
		pushArch(args, this.arch!);
		//DEBUG
		console.log(`Debug ARG for values : `,args);

		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('QUERY', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			const lines = stdout.split('\n')
			const items = lines.reduce((acc, line: string) => {
				if (line.length > 1) acc.push(line.trim());
				return acc
			}, <string[]>[])

			const result = items.reduce((acc, item: string) => {
				const match = ITEM_PATTERN.exec(item)
				if (match) {
					const regItem = new RegistryItemImpl(
						this.host, 
						this.hive, 
						this.key, 
						match[1].trim(),
						match[2].trim(), 
						match[3],
						this.arch!
					)
					acc.push(regItem)
				}
				return acc
			}, <RegistryItem[]>[])
			cb(null, result);
		}).catch(err => {
			cb(err);
		})
		return this
	}

	/**
	 * Retrieve all subkeys from this registry key.
	 * @param {function (err, items)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @param {array=} cb.items - an array of {@link Registry} objects
	 * @returns {Registry} this registry key object
	 */
	keys(cb: (err: Error | null, items?: Registry[]) => void): this {
		if (typeof cb !== 'function') throw new TypeError('must specify a callback');

		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		const args = [ 'QUERY', pathArg];

		pushArch(args, this.arch!);
		console.debug(`Debug ARG for keys : `,args);
		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('QUERY', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			const lines = stdout.split('\n')
			const items = lines.reduce((acc, line: string) => {
				if (line.length > 1) acc.push(line.trim());
				return acc
			}, <string[]>[])
			
			const result = items.reduce((acc, item: string) => {
				const match = ITEM_PATTERN.exec(item)
				if (match) {
					if (match[2] && (match[2] !== this.key)) {
						acc.push(new Registry({
							host: this.host,
							hive: this.hive,
							key:  match[2],
							arch: this.arch!
						}));
					}
				}
				return acc
			}, <Registry[]>[])
			cb(null, result);
		}).catch(err => {
			cb(err);
		})

		return this;
	}

	/**
	 * Gets a named value from this registry key.
	 * @param {string} name - the value name, use {@link Registry.DEFAULT_VALUE} or an empty string for the default value
	 * @param {function (err, item)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @param {RegistryItem=} cb.item - the retrieved registry item
	 * @returns {Registry} this registry key object
	 */
	get(name: string, cb: (err: Error | null, item?: RegistryItem) => void): this {
		if (typeof cb !== 'function') throw new TypeError('must specify a callback');

		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		let args = [ 'QUERY', pathArg];
		if (name == '') {
			args.push('/ve');
		} else {
			args = args.concat(['/v', name]);
		}

		pushArch(args, this.arch!);
		console.debug(`Debug ARG for get : `,args);
		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('QUERY', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			const lines = stdout.split('\n')
			let result = null
			const items = lines.reduce((acc, line: string) => {
				if (line.length > 1) acc.push(line.trim());
				return acc
			}, <string[]>[])

			const item = items[items.length-1] || ''
			console.debug(`Item`, items)
			const match = ITEM_PATTERN.exec(item)
			if (match) {
				result = new RegistryItemImpl(
					this.host, 
					this.hive, 
					this.key, 
					match[1].trim(),
					match[2].trim(), 
					match[3],
					this.arch!
				)
				cb(null, result);
			} else {
				cb(null, undefined);
			}
		}).catch(err => {
			cb(err);
		})

		return this;
	}

	/**
	 * Sets a named value in this registry key, overwriting an already existing value.
	 * @param {string} name - the value name, use {@link Registry.DEFAULT_VALUE} or an empty string for the default value
	 * @param {string} type - the value type
	 * @param {string} value - the value
	 * @param {function (err)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @returns {Registry} this registry key object
	 */
	set(name: string, type: string, value: string, cb: (err: Error | null, _ignored_?: unknown) => void): this {

		if (typeof cb !== 'function') throw new TypeError('must specify a callback');
		if (REG_TYPES.indexOf(type) == -1) throw Error('illegal type specified.');

		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		let args = ['ADD', pathArg];
		if (name == '') {
			args.push('/ve');
		}  else {
			args = args.concat(['/v', name]);
		}

		args = args.concat(['/t', type, '/d', value, '/f']);

		pushArch(args, this.arch!);
		console.log(`Debug ARG for set : `,args);
		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('ADD', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			cb(null, true);
		}).catch(err => {
			cb(err);
		})

		return this;
	}

	/**
	 * Remove a named value from this registry key. If name is empty, sets the default value of this key.
	 * Note: This key must be already existing.
	 * @param {string} name - the value name, use {@link Registry.DEFAULT_VALUE} or an empty string for the default value
	 * @param {function (err)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @returns {Registry} this registry key object
	 */
	remove (name: string, cb: (err: Error | null, _ignored_?: unknown) => void): this {
		if (typeof cb !== 'function') throw new TypeError('must specify a callback');

		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		const args = name ? ['DELETE', pathArg, '/f', '/v', name] : ['DELETE', pathArg, '/f', '/ve'];

		pushArch(args, this.arch!);
		console.log(`Debug ARG for REMOVE : `,args);
		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('DELETE', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			cb(null, true);
		}).catch(err => {
			cb(err);
		})
		return this;
	}

	/**
	 * Remove all subkeys and values (including the default value) from this registry key.
	 * @param {function (err)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @returns {Promise<Registry>} this registry key object
	 */
	clear(cb: (err: Error | null, _ignored_?: unknown) => void): this {
		if (typeof cb !== 'function') throw new TypeError('must specify a callback');

		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		const args = ['DELETE', pathArg, '/f', '/va'];
		pushArch(args, this.arch!);
		console.log(`Debug ARG for CLEAR : `,args);
		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('DELETE', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			cb(null, true);
		}).catch(err => {
			cb(err);
		})
		return this;
	}

	/**
	 * Alias for the clear method to keep it backward compatible.
	 * @method
	 * @deprecated Use {@link Registry#clear} or {@link Registry#destroy} in favour of this method.
	 * @param {function (err)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @returns {Registry} this registry key object
	 */
	erase(cb: (err: Error | null, _ignored_?: any) => void): this {
		return  this.clear(cb);
	}

	/**
	 * Delete this key and all subkeys from the registry.
	 * @param {function (err)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @returns {Registry} this registry key object
	 */
	destroy(cb: (err: Error | null, _ignored_?: unknown) => void): this {

		if (typeof cb !== 'function') throw new TypeError('must specify a callback');
		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		const args = ['DELETE', pathArg, '/f'];

		pushArch(args, this.arch!);
		console.log(`Debug ARG for DESTROY : `,args);

		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('DELETE', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			cb(null, true);
		}).catch(err => {
			cb(err);
		})
		return this;
	};

	/**
	 * Create this registry key. Note that this is a no-op if the key already exists.
	 * @param {function (err)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @returns {Registry} this registry key object
	 */
	create(cb: (err: Error | null, _ignored_?: unknown) => void): this {

		if (typeof cb !== 'function') throw new TypeError('must specify a callback');

		const pathArg = this.utf8 ? `"${this.path}"` : this.path;
		const args = ['ADD', pathArg, '/f'];
		pushArch(args, this.arch!);

		const  proc = $`${getRegExePath(this.utf8)} ${args.join(' ')}`
		proc.then(({stdout, stderr, code, success}) => {
			if (!success) cb(mkErrorMsg('ADD', code, {stdout, stderr}), undefined);
			if (code != 0) cb(new ProcessUncleanExitError(stderr, code));
			cb(null, true);
		}).catch(err => {
			cb(err);
		})
		return this;
	}

	/**
	 * Checks if this key already exists.
	 * @param {boolean} [ret] - if true, we return the value of the data returned from Values
	 * @returns {Promise<boolean>} true if a registry key with this name already exists
	 */
	keyExists(ret?:boolean): Promise<boolean | RegistryItem[] | Error> {
		return new Promise((resolve) => {
			this.values((err, items) => {
				if (err && ret) resolve(err);
				if (items && ret) resolve(items)
				if (err) resolve(false);
				if (items) resolve(true);
			})
		})
	}

	/**
	 * Checks if a value with the given name already exists within this key.
	 * @param {string} name - the value name, use {@link Registry.DEFAULT_VALUE} or an empty string for the default value
	 * @param {function (err, exists)} cb - callback function
	 * @param {ProcessUncleanExitError=} cb.err - error object or null if successful
	 * @param {boolean=} cb.exists - true if a value with the given name was found in this key
	 * @returns {Registry} this registry key object
	 */
	valueExists (name: string, cb: (err: Error | null, _ignored_?: unknown) => void): this {

		this.get(name, (err, _item) => {
			if (err) {
				if (err instanceof ProcessUncleanExitError && err.code == 1) {
					return cb(null, false);
				}
				return cb(err);
			}
			cb(null, true);
		});
		return this;
	}
}
