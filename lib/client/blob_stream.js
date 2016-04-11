function BlobReadStream(source, options){
	Stream.call(this);

	options = util.extend({
			readDelay: 0,
			paused: false,
			start: 0
	}, options);

	this._source = source;
	this._start = options.start;
	this._end = options.end || source.size;
	this._readChunkSize = options.chunkSize || source.size;
	this._readDelay = options.readDelay;

	this.readable = true;
	this.paused = options.paused;

	this._read();
}

util.inherits(BlobReadStream, Stream);


BlobReadStream.prototype.pause = function(){
	this.paused = true;
};

BlobReadStream.prototype.resume = function(){
	this.paused = false;
	this._read();
};

BlobReadStream.prototype.destroy = function(){
	this.readable = false;
	clearTimeout(this._timeoutId);
};

BlobReadStream.prototype._read = function(){

	var self = this;

	function emitReadChunk(){
		self._emitReadChunk();
	}

	var readDelay = this._readDelay;
	if (readDelay !== 0){
		this._timeoutId = setTimeout(emitReadChunk, readDelay);
	} else {
		util.setZeroTimeout(emitReadChunk);
	}

};

BlobReadStream.prototype._emitReadChunk = function(){

	if(this.paused || !this.readable) return;

	var chunkSize = Math.min(this._source.size - this._start, this._readChunkSize);

	if(chunkSize === 0){
			this.readable = false;
			this.emit("end");
			return;
	}

	var sourceEnd = this._start + chunkSize;

	/**
	 * Check if chunkSize if large than part size;
	 */
	if (sourceEnd > this._end) {
		sourceEnd = this._end;
	}

	/**
	 * Check if chunkSize if large than file size;
	 */
	if (sourceEnd > this._source.size) {
		sourceEnd = this._source.size;
	}

	var chunk = (this._source.slice || this._source.webkitSlice || this._source.mozSlice).call(this._source, this._start, sourceEnd);

	this._start = sourceEnd;
	this._read();

	this.emit("data", chunk);

};

exports.BlobReadStream = BlobReadStream;

