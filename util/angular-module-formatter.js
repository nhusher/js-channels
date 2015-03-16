var r = require("recast");
var n = require("ast-types").namedTypes;
var b = require("ast-types").builders;
var path = require('path');

function capitalize(str) {
  return str.charAt().toUpperCase() + str.slice(1);
}

function ModuleFormatter(file) {
  this.importedModules = [];
  this.exportedValues = [];
  this.file = file;
}

ModuleFormatter.prototype = {
  constructor: ModuleFormatter,
  transform: function(ast) {
    var body = ast.body,
        newBody;

    // Replaces the body with
    // angular.module("channels").service({{modulename}}, function({{deps}}) { {{body}} })
    newBody = b.expressionStatement(
        b.callExpression(
            b.memberExpression(
                b.callExpression(
                    b.memberExpression(
                        b.identifier('angular'),
                        b.identifier('module'),
                        false),
                    [b.literal("channels")]),
                b.identifier('service'),
                false), [
                  b.literal(this.getModuleName()),
                  b.functionExpression(null, this.importedModules.map(function(m) {
                    return b.identifier(m.moduleName);
                  }), b.blockStatement(
                        [].concat(b.variableDeclaration('var', [ b.variableDeclarator( b.identifier('ES6__EXPORTS'), b.objectExpression([])) ]))
                          .concat(body.slice(1))
                          .concat(this.exportedValues.map(function(ev) {
                            return b.expressionStatement(b.assignmentExpression(
                                "=",
                                b.memberExpression(b.identifier('ES6__EXPORTS'), b.identifier(ev[0]), false),
                                b.identifier(ev[1]),
                                false
                            ))
                          }))
                          .concat(b.returnStatement(b.identifier('ES6__EXPORTS')))))]));


    ast.body = [ newBody ];
  },
  importDeclaration: function(node, nodes) {
    throw new Error("Unsupported import declaration in module " + this.getModuleName());
  },
  importSpecifier: function(specifier, node, nodes) {
    var importName = node.source.value,
        fileName = path.basename(node.source.value, '.js'),
        modName = fileName === importName ? fileName : 'jsch' + capitalize(fileName),
        varImport,
        modImport;

    if(this.importedModules.some(function(m) { return m.moduleName === modName })) {
      modImport = this.importedModules.reduce(function(v, i) {
        return (i.moduleName === modName) ? i : v;
      }, null);
    } else {
      modImport = {
        moduleName: modName,
        values: []
      };

      this.importedModules.push(modImport);
    }

    if(specifier.type === 'ImportBatchSpecifier' && specifier.name.name !== modName) {
      nodes.push(b.variableDeclaration('var', [
          b.variableDeclarator(b.identifier(specifier.name.name), b.identifier(modName))
      ]));

    } else if(specifier.type === 'ImportSpecifier') {
      varImport = specifier.id.name;
      nodes.push(b.variableDeclaration('var', [
        b.variableDeclarator(b.identifier(varImport),
            b.memberExpression(b.identifier(modName), b.identifier(varImport), false))]));

    }

  },
  exportDeclaration: function(node, nodes) {
    throw new Error("Unsupported export declaration in module " + this.getModuleName());
  },
  exportSpecifier: function(specifier, node, nodes) {
    var name = (specifier.name) ? specifier.name.name : specifier.id.name,
        id = specifier.id.name;

    this.exportedValues.push([ name, id ]);
  },

  getModuleName: function() {
    return 'jsch' + capitalize(this.file.opts.basename);
  }
};

//ModuleFormatter.prototype.transform = function (ast) {
//  // this is ran after all transformers have had their turn at modifying the ast
//  // feel free to modify this however
//};
//
//ModuleFormatter.prototype.importDeclaration = function (node, nodes) {
//  // node is an ImportDeclaration
//};
//
//ModuleFormatter.prototype.importSpecifier = function (specifier, node, nodes) {
//  // specifier is an ImportSpecifier
//  // node is an ImportDeclaration
//};
//
//ModuleFormatter.prototype.exportDeclaration = function (node, nodes) {
//  // node is an ExportDeclaration
//};
//
//ModuleFormatter.prototype.exportSpecifier = function (specifier, node, nodes) {
//  // specifier is an ExportSpecifier
//  // node is an ExportDeclaration
//};


module.exports = ModuleFormatter;