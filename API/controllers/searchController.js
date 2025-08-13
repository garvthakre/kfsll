import pool from '../config/db.js';

export const searchBusiness = async (req, res) => {
  try {
    const {userid, compid, category, location, businesstype } = req.body;

    // Store search activity
    const criteria = 'Category = ' + category + ', Location = ' + location + ', Business Type = ' & businesstype;
    await pool.query(
      'INSERT INTO search_criteria_details (user_id, criteria) VALUES ($1, $2)',
      [userid, criteria]
    );

    // Perform actual business search
    const result = await pool.query(
      `SELECT c.name,c1.name catg,l.locations,t.display turnover,case when c4.constatus='N' then 'Not Connected' else 'Connected' end status 
	FROM category_master c1,bustype t,companies c 
        left outer join (SELECT l.company_id,string_agg(l.name, ', ' ORDER BY l.name) AS locations 
	FROM company_location c,locations l where c.loc_id=l.id  GROUP BY c.company_id) l on l.company_id=c.id and l.locations ILIKE $2
        left outer join (SELECT c.company_id,string_agg(c1.name, ', ' ORDER BY c1.name) AS subcategory 
	FROM company_category c,category_master c1 where c.sub_business_category_id=c1.id GROUP BY c.company_id) s on s.company_id=c.id and s.subcategory ILIKE $1
	left outer join connections c4 on c4.sender_company_id=c.id and c4.receiver_company_id=$4 
 	WHERE c.main_business_category_id=c1.id and c.turnover=t.id and c1.name ILIKE $1 and (t.display ILIKE $3 or t.short ILIKE $3)`,
      [`%${category}%`,`%${location}%`,`%${businesstype}%`, compid]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Search failed', error: err.message });
  }
};

export const compDet = async (req, res) => {
  try {
    const {compid} = req.body;

    // Get Details
    const result = await pool.query(
      `SELECT concat(c.name,' is a ',cast(to_char(current_date,'yyyy') as integer)-c.founding_year,' years old ',t.short,
' company. Having business interest in ',c1.name,' working in ',l.locations,'. You can contact ',p.persons) details
FROM category_master c1,companies c 
left outer join (SELECT l.company_id,string_agg(l.name, ', ' ORDER BY l.name) AS locations 
	FROM company_location c,locations l where c.loc_id=l.id  GROUP BY c.company_id) l on l.company_id=c.id 
left outer join (SELECT company_id,string_agg(concat(name,', ',designation,', ',phone,', ',email), ', ' ORDER BY name) AS persons 
	FROM company_personnel GROUP BY company_id) p on p.company_id=c.id 
left outer join bustype t on t.id=c.turnover
 	WHERE c.main_business_category_id=c1.id and c.id=$1`, [compid]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Detail fetching failed', error: err.message });
  }
};

export const compSum = async (req, res) => {
  try {
    const {compid} = req.body;

    // Get Details
    const result = await pool.query(
      `SELECT concat(c.name,' is a ',cast(to_char(current_date,'yyyy') as integer)-c.founding_year,' years old ',t.short,
' company. Having business interest in ',c1.name,' working in ',l.locations,'.') sumary
FROM category_master c1,companies c 
left outer join (SELECT company_id,string_agg(location, ', ' ORDER BY location) AS locations 
	FROM company_location GROUP BY company_id) l on l.company_id=c.id 
left outer join bustype t on t.id=c.turnover
 	WHERE c.main_business_category_id=c1.id and c.id=$1`, [compid]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Summary fetching failed', error: err.message });
  }
};

