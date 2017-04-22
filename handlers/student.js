'use strict';

var flow = require('nimble');

exports.find = function(request, reply) {

  var db = this.db;

  const result = { data: [], totalRecords: 0 };
  const series = [];

  const searchTxt = request.query.searchTxt || '';

  const pagesize = parseInt(request.query.pagesize);
  const pagenum = parseInt(request.query.pagenum);
  const stambukLamaLike = `${searchTxt}%`;
  const stambukBaruLike = `${searchTxt}%`;
  const namaLike = `%${searchTxt}`;
  const level = request.query.level;

  console.log(stambukLamaLike);

  const selectStudents = function selectStudents(callback){
    const query = 'SELECT * FROM tb_siswa WHERE (stambuk_lama LIKE ? or stambuk_baru LIKE ? or nama LIKE ?) AND tingkat = ? ORDER BY nama LIMIT ?,? ';

    db.query(
      query, [stambukLamaLike, stambukBaruLike, namaLike, level, pagenum * pagesize, pagesize],
      function(err, rows) {
        if (err) callback(err);
        result.data = rows;
        callback();
      }
    );
  }

  const countStudents = function countStudents(callback){
    const query = 'SELECT count(1) as totalRecords FROM tb_siswa WHERE (stambuk_lama LIKE ? or stambuk_baru LIKE ? or nama LIKE ? ) and tingkat = ? ';
    db.query(
      query, [stambukLamaLike, stambukBaruLike, namaLike, level],
      function(err, rows) {
        if (err) callback(err);
        result.totalRecords = rows[0].totalRecords;
        callback();
      }
    );
  }

  series.push(selectStudents, countStudents);

  flow.series(series, function(error){
    if(error){
      console.log(error);
      reply('Error while doing operation.').code(500);
    }else{
      reply(result);
    }

  });

};
