/*jshint -W069 */

const Jimp = require('jimp');
const sizeOf = require('buffer-image-size');
const { rect, rectFill, getScaledFont, getPadSize } = require('../utils');

/**
 * Detect faces in an image and predict the emotional state of each person
 * @class MaxFacialEmotionClassifier
 * @param {(string|object)} [domainOrOptions] - The project domain or options object. If object, see the object's optional properties.
 * @param {string} [domainOrOptions.domain] - The project domain
 * @param {object} [domainOrOptions.token] - auth token - object with value property and optional headerOrQueryName and isQuery properties
 */
var MaxFacialEmotionClassifier = (function(){
    'use strict';

    var request = require('request');
    var Q = require('q');

    function MaxFacialEmotionClassifier(options){
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
     * @name MaxFacialEmotionClassifier#request
     * @param {string} method - http method
     * @param {string} url - url to do request
     * @param {object} parameters
     * @param {object} body - body parameters / object
     * @param {object} headers - header parameters
     * @param {object} queryParameters - querystring parameters
     * @param {object} form - form data object
     * @param {object} deferred - promise object
     */
    MaxFacialEmotionClassifier.prototype.request = function(method, url, parameters, body, headers, queryParameters, form, deferred){
        var req = {
            method: method,
            uri: url,
            qs: queryParameters,
            headers: headers
        };
        if(Object.keys(form).length > 0) {
            req.formData = { 
                image: { 
                    value: form.image, 
                    options: { filename: 'image.png' }
                }
            };  
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
 * Return the list of labels that can be predicted by the model
 * @method
 * @name MaxFacialEmotionClassifier#get_labels
 * @param {object} parameters - method options and parameters
 */
 MaxFacialEmotionClassifier.prototype.get_labels = function(parameters){
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
 * @name MaxFacialEmotionClassifier#get_model_metadata_api
 * @param {object} parameters - method options and parameters
 */
 MaxFacialEmotionClassifier.prototype.get_model_metadata_api = function(parameters){
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
 * @name MaxFacialEmotionClassifier#predict
 * @param {object} parameters - method options and parameters
     * @param {file} parameters.image - An image file (encoded as JPEG, PNG or TIFF)
 */
 MaxFacialEmotionClassifier.prototype.predict = function(parameters){
    if(parameters === undefined) {
        parameters = {};
    }
    var deferred = Q.defer();
    var domain = this.domain,  path = '/model/predict';
    var body = {}, queryParameters = {}, headers = {}, form = {};

        headers['Accept'] = ['application/json'];
        headers['Content-Type'] = ['multipart/form-data'];

        
        
        

                if(parameters['image'] !== undefined){
                    form['image'] = parameters['image'];
                }

        if(parameters['image'] === undefined){
            deferred.reject(new Error('Missing required  parameter: image'));
            return deferred.promise;
        }
 
    queryParameters = mergeQueryParams(parameters, queryParameters);

    this.request('POST', domain + path, parameters, body, headers, queryParameters, form, deferred);

    return deferred.promise;
 };

    return MaxFacialEmotionClassifier;
})();

exports.MaxFacialEmotionClassifier = MaxFacialEmotionClassifier;

exports.createAnnotatedInput = async (imageData, modelData) => {
    const {width, height} = sizeOf(imageData);
    let fontType = getScaledFont(width, 'black');
    const font = await Jimp.loadFont(fontType);
    const canvas = await Jimp.read(imageData);
    const padSize = getPadSize(width);
    modelData.map(obj => obj.detection_box).forEach((box, i) => {
        // BOX GENERATION
        const xMax = box[3] * width;
        const xMin = box[1] * width;
        const yMax = box[2] * height;
        const yMin = box[0] * height;
        rect(canvas, xMin, yMin, xMax, yMax, padSize, 'cyan');
        // LABEL GENERATION
        const text = modelData[i].emotion_predictions[0].label;       
        const textHeight = Jimp.measureTextHeight(font, text);
        const xTagMax = Jimp.measureText(font, text) + (padSize*2) + xMin;
        const yTagMin = yMin - textHeight > 0 ? yMin - textHeight : yMin;
        rectFill(canvas, xMin, yTagMin, xTagMax, textHeight + yTagMin, padSize, 'cyan');
        canvas.print(font, xMin + padSize, yTagMin, text);
    });
    return canvas.getBufferAsync(Jimp.AUTO);
}