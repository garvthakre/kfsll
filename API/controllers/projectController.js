import pool from '../config/db.js';

export const saveCompProject = async (req, res) => {
  try {
    const { project_name, client_type, value, details, project_date } = req.body;
    const result = await pool.query(
      `INSERT INTO company_projects (company_id, project_name, client_type, value, details, project_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.company_id, project_name, client_type, value, details, project_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to save project', error: err.message });
  }
};

export const getCompProjects = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_projects WHERE company_id = $1', [req.params.compid]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error retrieving projects', error: err.message });
  }
};

export const getACompProject = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_projects WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching project', error: err.message });
  }
};

export const updateCompProject = async (req, res) => {
  try {
    const { id, project_name, client_type, value, details, project_date } = req.body;
    await pool.query(
      `UPDATE company_projects SET project_name=$1, client_type=$2, value=$3, details=$4, project_date=$5 WHERE id=$6`,
      [project_name, client_type, value, details, project_date, id]
    );
    res.json({ msg: 'Project updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Error updating project', error: err.message });
  }
};

export const deleteCompProject = async (req, res) => {
  try {
    await pool.query('DELETE FROM company_projects WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting project', error: err.message });
  }
};
