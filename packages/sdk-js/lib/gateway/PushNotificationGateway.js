const assert = require('@barchart/common-js/lang/assert'),
	Disposable = require('@barchart/common-js/lang/Disposable'),
	Enum = require('@barchart/common-js/lang/Enum');

const EndpointBuilder = require('@barchart/common-js/api/http/builders/EndpointBuilder'),
	Gateway = require('@barchart/common-js/api/http/Gateway'),
	ProtocolType = require('@barchart/common-js/api/http/definitions/ProtocolType'),
	ErrorInterceptor = require('@barchart/common-js/api/http/interceptors/ErrorInterceptor'),
	FailureReason = require('@barchart/common-js/api/failures/FailureReason'),
	FailureType = require('@barchart/common-js/api/failures/FailureType'),
	RequestInterceptor = require('@barchart/common-js/api/http/interceptors/RequestInterceptor'),
	ResponseInterceptor = require('@barchart/common-js/api/http/interceptors/ResponseInterceptor'),
	VerbType = require('@barchart/common-js/api/http/definitions/VerbType');

const Configuration = require('./../common/Configuration'),
	JwtProvider = require('../security/JwtProvider');

module.exports = (() => {
	'use strict';

	const REST_API_SECURE_PROTOCOL = 'https';
	const REST_API_SECURE_PORT = 443;

	/**
	 * The **central component of the SDK**. It is responsible for connecting to Barchart's
	 * Push Notification Service. It can be used to register and unregister devices.
	 *
	 * @public
	 * @exported
	 * @param {String} protocol - The protocol of the of the Barchart Push Notification Service web service (either http or https).
	 * @param {String} host - The hostname of the Barchart Push Notification Service web service.
	 * @param {Number} port - The TCP port number of the Barchart Push Notification Service web service.
	 * @param {String} environment - A description of the environment we're connecting to.
	 * @extends {Disposable}
	 */
	class PushNotificationGateway extends Disposable {
		constructor(protocol, host, port, environment) {
			super();

			this._environment = environment;

			this._jwtProvider = null;

			this._started = false;
			this._startPromise = null;

			const requestInterceptor = RequestInterceptor.fromDelegate((options, endpoint) => {
				return Promise.resolve()
					.then(() => {
						return this._jwtProvider.getToken()
							.then((token) => {
								options.headers = options.headers || {};
								options.headers.Authorization = `Bearer ${token}`;

								return options;
							});
					}).catch((e) => {
						const failure = FailureReason.forRequest({ endpoint: endpoint })
							.addItem(FailureType.REQUEST_IDENTITY_FAILURE)
							.format();

						return Promise.reject(failure);
					});
			});

			const responseInterceptor = ResponseInterceptor.fromDelegate((response, ignored) => {
				return response.data;
			});

			const protocolType = Enum.fromCode(ProtocolType, protocol.toUpperCase());

			this._registerEndpoint = EndpointBuilder.for('register-device', 'register your device')
				.withVerb(VerbType.POST)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) =>
					pb.withLiteralParameter('version', 'v2')
						.withLiteralParameter('register', 'register')
				)
				.withBody()
				.withRequestInterceptor(requestInterceptor)
				.withResponseInterceptor(responseInterceptor)
				.withErrorInterceptor(ErrorInterceptor.GENERAL)
				.endpoint;

			this._unregisterEndpoint = EndpointBuilder.for('unregister-device', 'unregister your device')
				.withVerb(VerbType.POST)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) =>
					pb.withLiteralParameter('version', 'v2')
						.withLiteralParameter('unregister', 'unregister')
				)
				.withBody()
				.withRequestInterceptor(requestInterceptor)
				.withResponseInterceptor(responseInterceptor)
				.withErrorInterceptor(ErrorInterceptor.GENERAL)
				.endpoint;
		}

		/**
		 * A description of the environment (e.g. development, production, etc).
		 *
		 * @public
		 * @return {String}
		 */
		get environment() {
			return this._environment;
		}

		/**
		 * Attempts to establish a connection to the backend. This function should be invoked
		 * immediately following instantiation. Once the resulting promise resolves, a
		 * connection has been established and other instance methods can be used.
		 *
		 * @public
		 * @param {JwtProvider} jwtProvider
		 * @returns {Promise<PushNotificationGateway>}
		 */
		connect(jwtProvider) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');

					if (this._startPromise === null) {
						this._startPromise = Promise.resolve()
							.then(() => {
								this._started = true;

								this._jwtProvider = jwtProvider;

								return this;
							}).catch((e) => {
								this._started = false;
								this._startPromise = null;

								this._jwtProvider = null;

								throw e;
							});
					}

					return this._startPromise;
				});
		}

		/**
		 * Registers an iOS or Android device to receive push notifications.
		 *
		 * @public
		 * @param {Schema.Device} device - User information for registering device to receive push notifications.
		 * @returns {Promise<Schema.Device>}
		 */
		registerDevice(device) {
			return Promise.resolve()
				.then(() => {
					checkStart.call(this);

					assert.argumentIsRequired(device, 'device', Object);
					assert.argumentIsRequired(device.user, 'device.user', Object);
					assert.argumentIsRequired(device.user.id, 'device.user.id', String);
					assert.argumentIsRequired(device.user.context, 'device.user.context', String);
					assert.argumentIsRequired(device.provider, 'device.provider', String);

					if (!device.apns && !device.fcm) {
						throw new Error('Either [ device.apns ] or [ device.fcm ] must be provided');
					}

					if (device.apns) {
						assert.argumentIsRequired(device.apns, 'device.apns', Object);
						assert.argumentIsRequired(device.apns.device, 'device.apns.device', String);
						assert.argumentIsRequired(device.apns.bundle, 'device.apns.bundle', String);
					}

					if (device.fcm) {
						assert.argumentIsRequired(device.fcm, 'device.fcm', Object);
						assert.argumentIsRequired(device.fcm.iid, 'device.fcm.iid', String);
						assert.argumentIsRequired(device.fcm.package, 'device.fcm.package', String);
						assert.argumentIsRequired(device.fcm.token, 'device.fcm.token', String);
					}

					return Gateway.invoke(this._registerEndpoint, device);
				});
		}

		/**
		 * Unregisters an iOS or Android device.
		 *
		 * @public
		 * @param {Schema.UnregisterRequest} data - User information for unregistering the device.
		 * @returns {Promise<Object>}
		 */
		unregisterDevice(data) {
			return Promise.resolve()
				.then(() => {
					checkStart.call(this);

					assert.argumentIsRequired(data, 'data', Object);
					assert.argumentIsRequired(data.user, 'data.user', Object);
					assert.argumentIsRequired(data.user.id, 'data.user.id', String);
					assert.argumentIsRequired(data.user.context, 'data.user.context', String);
					assert.argumentIsRequired(data.device, 'data.device', Object);
					assert.argumentIsRequired(data.device.device, 'data.device.device', String);
					assert.argumentIsRequired(data.device.bundle, 'data.device.bundle', String);

					return Gateway.invoke(this._unregisterEndpoint, {
						user: data.user.id,
						context: data.user.context,
						device: data.device.device,
						bundle: data.device.bundle
					});
				});
		}

		/**
		 * Creates and starts a new {@link PushNotificationGateway} for use in the private staging environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @returns {Promise<PushNotificationGateway>}
		 */
		static forStaging(jwtProvider) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');

					return start(new PushNotificationGateway(REST_API_SECURE_PROTOCOL, Configuration.stagingHost, REST_API_SECURE_PORT, 'staging'), jwtProvider);
				});
		}

		/**
		 * Creates and starts a new {@link PushNotificationGateway} for use in the public production environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @returns {Promise<PushNotificationGateway>}
		 */
		static forProduction(jwtProvider) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');

					return start(new PushNotificationGateway(REST_API_SECURE_PROTOCOL, Configuration.productionHost, REST_API_SECURE_PORT, 'production'), jwtProvider);
				});
		}

		_onDispose() {
		}

		toString() {
			return '[PushNotificationGateway]';
		}
	}

	function start(gateway, jwtProvider) {
		return gateway.connect(jwtProvider)
			.then(() => {
				return gateway;
			});
	}

	function checkStart() {
		if (this.getIsDisposed()) {
			throw new Error('Unable to use gateway, the gateway has been disposed.');
		}

		if (!this._started) {
			throw new Error('Unable to use gateway, the gateway has not started.');
		}
	}

	return PushNotificationGateway;
})();