const flow = require('nimble');
const moment = require('moment');

exports.find = function findTakenDepartments(request, reply) {
  const db = this.db;

  const siswaId = request.params.siswaId;

  const query = `
    SELECT tb.nama, tbd.* FROM tb_bagian_diambil tbd
    LEFT JOIN tb_bagian tb ON tbd.bagian_id = tb.id
    WHERE tbd.siswa_id = ?
  `;

  db.query(
    query, [siswaId],
     (err, rows) => {
       if (err) { reply('Error while doing operation.').code(500); return; }
       reply(rows);
     });
};

exports.createByLevel = function createByLevel(request, reply) {

  const studentId = request.payload.studentId;
  const level = request.payload.tingkat;
  const sufix = request.payload.sufix;
  const tanggalMulai = moment(request.payload.tanggal_mulai, 'YYYY-MM-DD').toDate();
  const series = [];
  const db = this.db;
  const result = { status: 'OK' };

  let departments = [];

  const findDepartmentsByLevel = function findDepartmentsByLevel(callback) {
    const query = 'SELECT * FROM tb_bagian WHERE tingkat = ?';

    db.query(
      query, [level],
       (err, rows) => {
         if (err) { callback(err); return; }
         departments = rows;
         callback();
       });
  };

  const createDepartments = function createDepartments(callback) {
    const parallels = [];

    for (let i = 0; i < departments.length; i += 1) {
      //---Closure
      (function f() {
        const department = departments[i];
        const createDepartment = function createDepartment(paralleCallback) {
          db.query(`
            INSERT INTO tb_bagian_diambil
            SET
              siswa_id = ?,
              bagian_id = ?,
              judul = ?,
              plan_start_date = ?
            `,
            [
              studentId,
              department.id,
              `${department.nama} ${sufix}`,
              tanggalMulai,
            ], (err, result) => {
              if (err) {
                console.dir(err);
                paralleCallback(err);
                return;
              }
              paralleCallback();
            });
        };
        parallels.push(createDepartment);
      })();
      //----------
    }

    flow.parallel(parallels, (error) => {
      if (error) {
        console.log(error);
        db.rollback(() => {
          callback(error);
        });
      } else {
        db.commit((errCommit) => {
          if (errCommit) {
            db.rollback(() => {
              callback(error);
            });
          }
          callback();
        });
      }
    });
  };

  series.push(findDepartmentsByLevel, createDepartments);

  db.beginTransaction((err) => {
    if (err) { throw err; }
    flow.series(series, (error) => {
      if (error) {
        console.log(error);
        db.rollback(() => {
          reply('Error while doing operation.').code(500);
        });
      } else {
        db.commit((errCommit) => {
          if (errCommit) {
            db.rollback(() => {
              reply('Error while doing operation.').code(500);
            });
          }
          reply(result);
        });
      }
    });
  });
};
