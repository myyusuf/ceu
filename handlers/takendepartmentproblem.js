"use strict"

exports.find = function findTakenDepartmentProblem(request, reply) {
  const db = this.db;

  const query = 'SELECT * FROM tb_jenis_masalah_bagian ';

  db.query(
    query, [],
     (err, rows) => {
       if (err) reply('Error while doing operation.').code(500);
       reply(rows);
     }
  );
};
