var mixin = require('smart-mixin');
var assign = require('object-assign');

var defaultConstraints = {
  // lifecycle stuff is as you'd expect
  componentDidMount: mixin.MANY,
  componentWillMount: mixin.MANY,
  componentWillReceiveProps: mixin.MANY,
  shouldComponentUpdate: mixin.ONCE,
  componentWillUpdate: mixin.MANY,
  componentDidUpdate: mixin.MANY,
  componentWillUnmount: mixin.MANY,
  getChildContext: mixin.MANY_MERGED
};

function buildMixinProto(constraints) {
  var mergedConstraints = assign(defaultConstraints, constraints);
  return mixin(mergedConstraints);
}

function setDefaultProps(reactMixin) {
  var getDefaultProps = reactMixin.getDefaultProps;

  if(getDefaultProps) {
    reactMixin.defaultProps = getDefaultProps();

    delete reactMixin.getDefaultProps;
  }
}

function setInitialState(reactMixin) {
  var getInitialState = reactMixin.getInitialState;
  var componentWillMount = reactMixin.componentWillMount;

  if(getInitialState) {
    if(!componentWillMount) {
      reactMixin.componentWillMount = function() {
        this.setState(getInitialState.call(this));
      };
    }
    else {
      reactMixin.componentWillMount = function() {
        this.setState(getInitialState.call(this));
        componentWillMount.call(this);
      };
    }

    delete reactMixin.getInitialState;
  }
}

function mixinClass(reactClass, reactMixin) {
  setDefaultProps(reactMixin);
  setInitialState(reactMixin);

  var prototypeMethods = {};
  var staticProps = {};

  Object.keys(reactMixin).forEach(function(key) {
    if(typeof reactMixin[key] === 'function') {
      prototypeMethods[key] = reactMixin[key];
    }
    else {
      staticProps[key] = reactMixin[key];
    }
  });

  buildMixinProto(reactMixin._constraints)(reactClass.prototype, prototypeMethods);

  mixin(assign({
    childContextTypes: mixin.MANY_MERGED_LOOSE,
    contextTypes: mixin.MANY_MERGED_LOOSE,
    propTypes: mixin.MANY_MERGED_LOOSE,
    defaultProps: mixin.MANY_MERGED_LOOSE
  }, reactMixin._constraints))(reactClass, staticProps);
}

module.exports = (function () {
  reactMixin = function(proto, mixin) {
    buildMixinProto(mixin._constraints)(proto, mixin);
  }

  reactMixin.onClass = function(reactClass, mixin) {
    mixinClass(reactClass, mixin)
  };

  reactMixin.decorate = function(mixin) {
    return function(reactClass) {
      return reactMixin.onClass(reactClass, mixin);
    };
  }

  return reactMixin;
})();
