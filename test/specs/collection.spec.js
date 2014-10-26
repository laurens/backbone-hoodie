/* jshint expr: true */

'use strict';

describe('Backbone.Collection', function () {

  beforeEach(function () {
    Backbone.connect('http://example.com');

    this.Task = Backbone.Model.extend({
      type: 'task'
    });

    this.Tasks = Backbone.Collection.extend({
      model: this.Task
    });

    this.testAttributes = {
      id: 'juyc3ej',
      name: 'New Task'
    };

    this.sandbox = sinon.sandbox.create();

    var deferred = jQuery.Deferred();
    this.deferred = deferred;
    this.promiseMethodStub = function () {
      return deferred.promise();
    };
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('Backbone.Collection.prototype.initialize', function() {
    beforeEach(function () {
      var events = {};
      this.events = events;
      this.stubStore = this.sandbox.stub(Backbone.hoodie, 'store', function () {
        return {
          on: function (event, callback) {
            events[event] = callback;
          }
        };
      });

      this.tasks = new this.Tasks();
    });

    it('initializes the hoodie store', function () {
      expect(this.stubStore).to.have.been.calledWith('task');
    });

    describe('hoodie store event listeners', function () {
      describe('add', function () {
        beforeEach(function () {
          this.addSpy = this.sandbox.spy(this.tasks, 'add');
        });

        describe('from remote', function () {
          it('adds a new model to the collection', function () {
            this.events.add(this.testAttributes, { remote: true });
            expect(this.addSpy).to.have.been.calledWith(this.testAttributes, { remote: true });
          });
        });

        describe('from the client', function () {
          it('does not add the model to the collection again', function () {
            this.events.add(this.testAttributes, { remote: false });
            expect(this.addSpy).to.not.have.been.called;
          });
        });
      });

      describe('update', function () {
        beforeEach(function () {
          this.task = new this.Task(this.testAttributes);
          this.setSpy = this.sandbox.spy(this.task, 'set');
        });

        describe('from remote', function () {
          describe('when the model exists', function () {
            it('updates the model', function () {
              this.tasks.add(this.task);
              this.events.update(this.testAttributes, { remote: true });
              expect(this.setSpy).to.have.been.calledWith(this.testAttributes, { remote: true });
            });
          });

          describe('when the model does not exist', function () {
            it('it does not throw an exception', function () {
              expect(this.events.update({ id: 'unknown' }, { remote: true })).to.not.throw;
            });
          });
        });

        describe('from the client', function () {
          it('does not update the model again', function () {
            this.tasks.add(this.task);
            this.events.update(this.testAttributes, { remote: false });
            expect(this.setSpy).to.not.have.been.called;
          });
        });
      });

      describe('remove', function () {
        beforeEach(function () {
          this.task = new this.Task(this.testAttributes);
          this.destroySpy = this.sandbox.spy(this.task, 'destroy');
        });

        describe('from remote', function () {
          describe('when the model exists', function () {
            it('removes the model from the collection', function () {
              this.tasks.add(this.task);
              this.events.remove(this.testAttributes, { remote: true });
              expect(this.destroySpy).to.have.been.called;
            });
          });

          describe('when the model does not exist', function () {
            it('it does not throw an exception', function () {
              expect(this.events.remove({ id: 'unknown' }, { remote: true })).to.not.throw;
            });
          });
        });

        describe('from the client', function () {
          it('does not add the model to the collection again', function () {
            this.tasks.add(this.task);
            this.events.remove(this.testAttributes, { remote: false });
            expect(this.destroySpy).to.not.have.been.called;
          });
        });
      });
    });
  });

  describe('Backbone.Collection.prototype.create', function() {
    beforeEach(function () {
      this.stub = this.sandbox.stub(Backbone.hoodie.store, 'add', this.promiseMethodStub);

      this.spyOnSuccess = sinon.spy();
      this.spyOnError = sinon.spy();

      this.tasks = new this.Tasks();
      this.tasks.create({ name: 'New Task' }, {
        success: this.spyOnSuccess,
        error: this.spyOnError
      });
    });

    it('delegates to Backbone.hoodie.store.add', function () {
      expect(this.stub).to.have.been.calledWith('task', { name: 'New Task' });
    });

    describe('success', function () {
      beforeEach(function () {
        this.deferred.resolve(this.testAttributes);
      });

      it('updates the attributes', function () {
        expect(this.tasks.at(0).attributes).to.deep.eql(this.testAttributes);
      });

      it('calls the success callback', function () {
        expect(this.spyOnSuccess).to.have.been.called;
      });
    });

    describe('failure', function () {
      beforeEach(function () {
        this.deferred.reject({});
      });

      it('calls the error callback', function () {
        expect(this.spyOnError).to.have.been.called;
      });
    });
  });

  describe('Backbone.Collection.prototype.fetch', function() {
    beforeEach(function () {
      this.stub = this.sandbox.stub(Backbone.hoodie.store, 'findAll', this.promiseMethodStub);

      this.spyOnSuccess = sinon.spy();
      this.spyOnError = sinon.spy();

      this.tasks = new this.Tasks();
      this.tasks.fetch({
        success: this.spyOnSuccess,
        error: this.spyOnError
      });
    });

    it('delegates to Backbone.hoodie.store.findAll', function () {
      expect(this.stub).to.have.been.calledWith('task');
    });

    describe('success', function () {
      beforeEach(function () {
        this.deferred.resolve([this.testAttributes]);
      });

      it('updates the collection', function () {
        expect(this.tasks.at(0).attributes).to.deep.eql(this.testAttributes);
      });

      it('calls the success callback', function () {
        expect(this.spyOnSuccess).to.have.been.called;
      });
    });

    describe('failure', function () {
      beforeEach(function () {
        this.deferred.reject({});
      });

      it('calls the error callback', function () {
        expect(this.spyOnError).to.have.been.called;
      });
    });
  });

  describe('Backbone.Collection.prototype.fetch with filter', function() {
    beforeEach(function () {
      this.stub = this.sandbox.stub(Backbone.hoodie.store, 'findAll', this.promiseMethodStub);

      this.filter = {
        foo: 'bar'
      };

      this.tasks = new this.Tasks();
      this.tasks.fetch({
        filter: this.filter
      });
    });

    it('delegates to Backbone.hoodie.store.findAll', function () {
      expect(this.stub).to.have.been.calledWith(this.filter);
    });
  });
});
