import React, { useEffect, useMemo, useState, useContext } from 'react';
import { fetchDataFromApi, editData } from '../../utils/api';
import { MyContext } from '../../App';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Pagination from '@mui/material/Pagination';
import { emphasize, styled } from '@mui/material/styles';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Breadcrumb style copied from other pages for consistency
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor = theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[800];
  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    '&:hover, &:focus': {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    '&:active': {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all | unread | read
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const context = useContext(MyContext);

  const load = async () => {
    setLoading(true);
    const res = await fetchDataFromApi('/api/notifications');
    if (res) {
      if (res.success === true && res.data) setNotifications(res.data);
      else if (Array.isArray(res)) setNotifications(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await editData(`/api/notifications/${id}/read`, {});
    context.setAlertBox({ open: true, error: false, msg: 'Notification marked read' });
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setSelected((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
  };

  const markAll = async () => {
    await editData('/api/notifications/read-all', {});
    context.setAlertBox({ open: true, error: false, msg: 'All notifications marked read' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setSelected(new Set());
  };

  const markSelected = async () => {
    if (selected.size === 0) return;
    await Promise.all(Array.from(selected).map((id) => editData(`/api/notifications/${id}/read`, {})));
    context.setAlertBox({ open: true, error: false, msg: 'Selected notifications marked read' });
    setNotifications((prev) => prev.map((n) => (selected.has(n._id) ? { ...n, isRead: true } : n)));
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const ids = visibleItems.map((n) => n._id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = notifications;
    if (statusFilter === 'unread') list = list.filter((n) => !n.isRead);
    else if (statusFilter === 'read') list = list.filter((n) => n.isRead);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((n) =>
        (n.title || '').toLowerCase().includes(q) || (n.message || '').toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((n) => new Date(n.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      // include entire day
      to.setHours(23, 59, 59, 999);
      list = list.filter((n) => new Date(n.createdAt) <= to);
    }
    return list;
  }, [notifications, statusFilter, query, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  const onChangePerPage = (e) => {
    setPerPage(Number(e.target.value) || 10);
    setPage(1);
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  return (
    <>
      <div className="right-content w-100">
        {/* Header Card */}
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Notifications</h5>

          <div className="ml-auto d-flex align-items-center">
            <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
              <StyledBreadcrumb component="a" href="#" label="Dashboard" icon={<HomeIcon fontSize="small" />} />
              <StyledBreadcrumb label="Notifications" deleteIcon={<ExpandMoreIcon />} />
            </Breadcrumbs>

            <Button className="ml-3" variant="outlined" size="small" onClick={load} disabled={loading}>Refresh</Button>
            <Button className="ml-2" variant="outlined" size="small" onClick={markSelected} disabled={selected.size === 0}>Mark selected read</Button>
            <Button className="ml-2 btn-blue" size="small" onClick={markAll}>Mark all read</Button>
          </div>
        </div>

        {/* Content Card */}
        <div className="card shadow border-0 p-3 mt-4">
          {/* Filters Row */}
          <div className="d-flex flex-wrap align-items-end">
            <div className="btn-group mr-2 mb-2" role="group" aria-label="Filter status">
              <Button variant={statusFilter === 'all' ? 'contained' : 'outlined'} size="small" onClick={() => { setStatusFilter('all'); setPage(1); }}>All</Button>
              <Button variant={statusFilter === 'unread' ? 'contained' : 'outlined'} size="small" className="ml-1" onClick={() => { setStatusFilter('unread'); setPage(1); }}>Unread</Button>
              <Button variant={statusFilter === 'read' ? 'contained' : 'outlined'} size="small" className="ml-1" onClick={() => { setStatusFilter('read'); setPage(1); }}>Read</Button>
            </div>

            <TextField size="small" label="Search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="mr-2 mb-2" />

            <div className="d-flex align-items-center mr-2 mb-2">
              <label className="mr-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="d-flex align-items-center mr-2 mb-2">
              <label className="mr-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>

            <div className="d-flex align-items-center mr-2 mb-2">
              <label className="mr-1">Per page</label>
              <select value={perPage} onChange={onChangePerPage}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive mt-3">
            {loading ? (
              <div className="p-3">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-3">No notifications</div>
            ) : (
              <table className="table table-bordered table-striped v-align">
                <thead className="thead-dark">
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        onChange={toggleSelectAllVisible}
                        checked={visibleItems.length > 0 && visibleItems.every((n) => selected.has(n._id))}
                      />
                    </th>
                    <th>Title</th>
                    <th>Message</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 200 }}>Created At</th>
                    <th style={{ width: 140 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((n) => (
                    <tr key={n._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(n._id)}
                          onChange={() => toggleSelect(n._id)}
                        />
                      </td>
                      <td>{n.title}</td>
                      <td>{n.message}</td>
                      <td>
                        {n.isRead ? (
                          <span className="badge badge-secondary">Read</span>
                        ) : (
                          <span className="badge badge-primary">Unread</span>
                        )}
                      </td>
                      <td>{formatDate(n.createdAt)}</td>
                      <td>
                        {!n.isRead && (
                          <Button size="small" onClick={() => markRead(n._id)}>Mark read</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-2">
              <div>
                Page {currentPage} of {totalPages} · {filtered.length} total
              </div>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, p) => setPage(p)}
                color="primary"
                size="small"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
