/*jshint -W069 */
/**
 * This model generates captions from a fixed vocabulary that describe the contents of images in the COCO Dataset. The model consists of an encoder model – a deep convolutional net using the Inception-v3 architecture trained on ImageNet-2012 data – and a decoder model – an LSTM network that is trained conditioned on the encoding from the image encoder model. The input to the model is an image, and the output is a sentence describing the image content. The model is based on the Show and Tell Image Caption Generator Model.
 * @class ModelAssetExchangeServer
 * @param {(string|object)} [domainOrOptions] - The project domain or options object. If object, see the object's optional properties.
 * @param {string} [domainOrOptions.domain] - The project domain
 * @param {object} [domainOrOptions.token] - auth token - object with value property and optional headerOrQueryName and isQuery properties
 */
var ModelAssetExchangeServer = (function(){
    'use strict';

    var request = require('request');
    var Q = require('q');

    function ModelAssetExchangeServer(options){
        var domain = (typeof options === 'object') ? options.domain : options;
        this.domain = domain ? domain : '';
        if(this.domain.length === 0) {
            throw new Error('Domain parameter must be specified as a string.');
        }
    }

    function mergeQueryParams(parameters, queryParameters) {
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters)
                  .forEach(function(parameterName) {
                      var parameter = parameters.$queryParameters[parameterName];
                      queryParameters[parameterName] = parameter;
            });
        }
        return queryParameters;
    }

    /**
     * HTTP Request
     * @method
     * @name ModelAssetExchangeServer#request
     * @param {string} method - http method
     * @param {string} url - url to do request
     * @param {object} parameters
     * @param {object} body - body parameters / object
     * @param {object} headers - header parameters
     * @param {object} queryParameters - querystring parameters
     * @param {object} form - form data object
     * @param {object} deferred - promise object
     */
    ModelAssetExchangeServer.prototype.request = function(method, url, parameters, body, headers, queryParameters, form, deferred){
        var req = {
            method: method,
            uri: url,
            qs: queryParameters,
            headers: headers
        };
        if(Object.keys(form).length > 0) {
            req.formData = { image: { value: form.body, options: { filename: 'image.jpg' }}};
        }
        if(typeof(body) === 'object' && !(body instanceof Buffer)) {
            req.json = true;
        }
        request(req, function(error, response, body){
            if(error) {
                deferred.reject(error);
            } else {
                if(/^application\/(.*\\+)?json/.test(response.headers['content-type'])) {
                    try {
                        body = JSON.parse(body);
                    } catch(e) {}
                }
                if(response.statusCode === 204) {
                    deferred.resolve({ response: response });
                } else if(response.statusCode >= 200 && response.statusCode <= 299) {
                    deferred.resolve({ response: response, body: body });
                } else {
                    deferred.reject({ response: response, body: body });
                }
            }
        });
    };


/**
 * Return the metadata associated with the model
 * @method
 * @name ModelAssetExchangeServer#get_metadata
 * @param {object} parameters - method options and parameters
 */
 ModelAssetExchangeServer.prototype.get_metadata = function(parameters){
    if(parameters === undefined) {
        parameters = {};
    }
    var deferred = Q.defer();
    var domain = this.domain,  path = '/model/metadata';
    var body = {}, queryParameters = {}, headers = {}, form = {};

        headers['Accept'] = ['application/json'];
        headers['Content-Type'] = ['application/json'];

    queryParameters = mergeQueryParams(parameters, queryParameters);

    this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

    return deferred.promise;
 };
/**
 * Make a prediction given input data
 * @method
 * @name ModelAssetExchangeServer#predict
 * @param {object} parameters - method options and parameters
     * @param {file} parameters.body - This model generates captions from a fixed vocabulary that describe the contents of images in the COCO Dataset. The model consists of an encoder model – a deep convolutional net using the Inception-v3 architecture trained on ImageNet-2012 data – and a decoder model – an LSTM network that is trained conditioned on the encoding from the image encoder model. The input to the model is an image, and the output is a sentence describing the image content. The model is based on the Show and Tell Image Caption Generator Model.
 */
 ModelAssetExchangeServer.prototype.predict = function(parameters){
    if(parameters === undefined) {
        parameters = {};
    }
    var deferred = Q.defer();
    var domain = this.domain,  path = '/model/predict';
    var body = {}, queryParameters = {}, headers = {}, form = {};

        headers['Accept'] = ['application/json'];
        headers['Content-Type'] = ['multipart/form-data'];

        
        
        

                if(parameters['body'] !== undefined){
                    form['body'] = parameters['body'];
                }

        if(parameters['body'] === undefined){
            deferred.reject(new Error('Missing required  parameter: body'));
            return deferred.promise;
        }
 
    queryParameters = mergeQueryParams(parameters, queryParameters);

    this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

    return deferred.promise;
 };

    return ModelAssetExchangeServer;
})();

exports.ModelAssetExchangeServer = ModelAssetExchangeServer;
