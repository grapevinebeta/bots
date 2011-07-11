/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 7/10/11
 * Time: 10:44 PM
 * To change this template use File | Settings | File Templates.
 */
require.paths.unshift("/usr/local/lib/node_modules");
var webservice = require('webservice'),
        blackbox = require('./modules/blackbox');

webservice.createServer(blackbox).listen(8080);
console.log(' > json webservice started on port 8080');
