import pool from '../config/db.js';

export const getConnections = async (req, res) => {
  try {
    const { compid } = req.body;
    const cons = await pool.query(`Select c.id,c1.name cname,u.name uname,c1.contact,c.status 
from public.connections c,public.companies c1,public.users u 
where c.sender_company_id=c1.id and u.company_id=c1.id 
and c.receiver_company_id=$1 order by c.created_at desc`, [compid]);
    res.json({ connection: cons.rows });
  } catch (err) {
    res.status(500).json({ msg: 'Error retrieving connections', error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userid } = req.body;
    const msg = await pool.query(`Select m.id,to_char(sent_at,'dd-Mon') mdate,u.name uname,c.name cname,m.subject,case when m.is_read then 'Yes' else 'No' end status 
from public.messages m,public.users u,public.companies c 
where u.company_id=c.id and m.sender_id=u.id 
and m.receiver_id=$1 order by m.sent_at desc`, [userid]);
    res.json({ message: msg.rows });
  } catch (err) {
    res.status(500).json({ msg: 'Error retrieving messages', error: err.message });
  }
};

export const getArticles = async (req, res) => {
  try {
    const { userid } = req.body;
    const art = await pool.query(`Select to_char(a.created_at,'dd-Mon') adate,c.name cname,a.title,
	case when user_id is null then 'Not Read' else case when t.reject=true then 'Reject' else 'Read' end end status 
	from users u,companies c,company_interests i,category_master c1,articles a 
	left join articles_tran t on a.id=t.article_id and t.user_id=$1
	where a.author_id=u.id and u.company_id=c.id and status<>'Reject' and i.company_id=c.id and 
	i.category_id=c1.id and i.interest_type='A' and c1.name ilike concat('%',a.category,'%') order by a.created_at desc`, [userid]);
    res.json({ articles: art.rows });
  } catch (err) {
    res.status(500).json({ msg: 'Error retrieving articles', error: err.message });
  }
};
