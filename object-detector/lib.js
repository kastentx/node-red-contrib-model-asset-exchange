/*jshint -W069 */

const Jimp = require('jimp');
const sizeOf = require('buffer-image-size');
const { rect, rectFill, getScaledFont, getPadSize } = require('../utils');

/**
 * This model recognizes the objects present in an image from the 80 different high-level classes of objects in the COCO Dataset. The model consists of a deep convolutional net base model for image feature extraction, together with additional convolutional layers specialized for the task of object detection, that was trained on the COCO data set. The input to the model is an image, and the output is a list of estimated class probabilities for the objects detected in the image. The model is based on the SSD Mobilenet V1 object detection model for TensorFlow.
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
     * Return the list of labels that can be predicted by the model
     * @method
     * @name ModelAssetExchangeServer#get_labels
     * @param {object} parameters - method options and parameters
     */
    ModelAssetExchangeServer.prototype.get_labels = function(parameters){
        if(parameters === undefined) {
            parameters = {};
        }
        var deferred = Q.defer();
        var domain = this.domain,  path = '/model/labels';
        var body = {}, queryParameters = {}, headers = {}, form = {};

            headers['Accept'] = ['application/json'];
            headers['Content-Type'] = ['application/json'];

        queryParameters = mergeQueryParams(parameters, queryParameters);

        this.request('GET', domain + path, parameters, body, headers, queryParameters, form, deferred);

        return deferred.promise;
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
 * Make a prediction given input data
 * @method
 * @name ModelAssetExchangeServer#predict
 * @param {object} parameters - method options and parameters
     * @param {file} parameters.body - An image file (encoded as PNG or JPG/JPEG)
     * @param {number} parameters.threshold - Probability threshold for including a detected object in the response in the range [0, 1] (default: 0.7). Lowering the threshold includes objects the model is less certain about.
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
 

                if(parameters['threshold'] !== undefined){
                    queryParameters['threshold'] = parameters['threshold'];
                }
        
        
        


 
    queryParameters = mergeQueryParams(parameters, queryParameters);

    this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

    return deferred.promise;
 };

    return ModelAssetExchangeServer;
})();

exports.ModelAssetExchangeServer = ModelAssetExchangeServer;

exports.createAnnotatedInput = async (imageData, modelData) => {
    const {width, height} = sizeOf(imageData);
    let fontType = getScaledFont(width, 'black');
    const font = await Jimp.loadFont(fontType);
    const canvas = await Jimp.read(imageData);
    const padSize = getPadSize(width);
    modelData.map(obj => obj.detection_box).forEach((box, i) => {
        const xMax = box[3] * width;
        const xMin = box[1] * width;
        const yMax = box[2] * height;
        const yMin = box[0] * height;
        rect(canvas, xMin, yMin, xMax, yMax, padSize, 'cyan');
        // LABEL GENERATION
        const text = modelData[i].label;
        const textHeight = Jimp.measureTextHeight(font, text);
        const xTagMax = Jimp.measureText(font, text) + (padSize*2) + xMin;
        const yTagMin = yMin - textHeight > 0 ? yMin - textHeight : yMin;
        rectFill(canvas, xMin, yTagMin, xTagMax, textHeight + yTagMin, padSize, 'cyan');
        canvas.print(font, xMin + padSize, yTagMin, text);
    });
    return canvas.getBufferAsync(Jimp.AUTO);
}
