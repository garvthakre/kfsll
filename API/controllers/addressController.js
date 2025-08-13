import pool from '../config/db.js';

export const saveCompAddress = async (req, res) => {
  try {
    const { compid, address_type_id, country_iso, state_id, address_line} = req.body;
    
    // Basic validation
    if (!address_line ||  !state_id || !country_iso) {
      return res.status(400).json({ msg: 'Address line, state, and country are required' });
    }

    const result = await pool.query(
      `INSERT INTO company_addresses (company_id, add_type_id, address_line, state_id, country_iso)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [compid, address_type_id, address_line, state_id, country_iso]
    );
    
    res.status(201).json({
      msg: 'Address saved successfully',
      address: result.rows[0]
    });
  } catch (err) {
    console.error('Save address error:', err);
    res.status(500).json({ msg: 'Failed to save address', error: err.message });
  }
};

export const getCompAddresses = async (req, res) => {
  try {
    const { compid} = req.body;
    const result = await pool.query(
      'SELECT a.add_type_id,s.state_name,c.country_name,a.address_line FROM company_addresses a,public.state_master s,public.country_master c WHERE a.country_iso=c.iso_code and a.state_id=s.id and a.company_id=$1 ORDER BY a.id', 
      [compid]
    );
    
    res.json({
      msg: 'Addresses retrieved successfully',
      addresses: result.rows
    });
  } catch (err) {
    console.error('Get addresses error:', err);
    res.status(500).json({ msg: 'Error retrieving addresses', error: err.message });
  }
};

export const getACompAddress = async (req, res) => {
  try {
    const { compid} = req.body;
    const result = await pool.query(
      'SELECT * FROM company_addresses WHERE id = $1', 
      [compid]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Address not found' });
    }
    
    res.json({
      msg: 'Address retrieved successfully',
      address: result.rows[0]
    });
  } catch (err) {
    console.error('Get address error:', err);
    res.status(500).json({ msg: 'Error fetching address', error: err.message });
  }
};

export const updateCompAddress = async (req, res) => {
  try {
    const { id, address_type_id, address_line, city, state_id, country_iso, pincode } = req.body;
    
    // Basic validation
    if (!id) {
      return res.status(400).json({ msg: 'Address ID is required' });
    }

    // Check if address exists
    const checkResult = await pool.query(
      'SELECT id FROM company_addresses WHERE id = $1', 
      [id]
    );
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ msg: 'Address not found' });
    }

    const result = await pool.query(
      `UPDATE company_addresses SET 
        add_type_id = $1, 
        address_line = $2, 
        city = $3, 
        state_id = $4,
        country_iso = $5, 
        pincode = $6 
       WHERE id = $7 RETURNING *`,
      [address_type_id, address_line, city, state_id, country_iso, pincode, id]
    );
    
    res.json({
      msg: 'Address updated successfully',
      address: result.rows[0]
    });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ msg: 'Error updating address', error: err.message });
  }
};

export const deleteCompAddress = async (req, res) => {
  try {
    const { compid} = req.body;
    const result = await pool.query(
      'DELETE FROM company_addresses WHERE id = $1 RETURNING *', 
      [compid]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Address not found' });
    }
    
    res.json({
      msg: 'Address deleted successfully',
      deletedAddress: result.rows[0]
    });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ msg: 'Error deleting address', error: err.message });
  }
};