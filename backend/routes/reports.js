const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/reports/daily-summary
 * Get daily summary of team activity (Manager only)
 * 
 * Query Parameters:
 * - date (required): YYYY-MM-DD format
 * - employee_id (optional): Filter by specific employee
 */
router.get('/daily-summary', authenticateToken, requireManager, async (req, res) => {
    try {
        const { date, employee_id } = req.query;

        // Validate date parameter
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required (YYYY-MM-DD format)'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD format'
            });
        }

        // Build the query based on whether employee_id filter is provided
        let employeeFilter = '';
        const params = [req.user.id, date];

        if (employee_id) {
            employeeFilter = ' AND ch.employee_id = ?';
            params.push(employee_id);
        }

        // Single efficient query to get all employee data with aggregates
        // Avoids N+1 queries by using GROUP BY
        const [employeeBreakdown] = await pool.execute(
            `SELECT 
                u.id as employee_id,
                u.name as employee_name,
                u.email as employee_email,
                COUNT(ch.id) as checkins,
                COUNT(DISTINCT ch.client_id) as clients_visited,
                SUM(
                    CASE 
                        WHEN ch.checkout_time IS NOT NULL 
                        THEN (julianday(ch.checkout_time) - julianday(ch.checkin_time)) * 24
                        ELSE 0 
                    END
                ) as total_hours,
                AVG(ch.distance_from_client) as avg_distance
            FROM users u
            LEFT JOIN checkins ch ON u.id = ch.employee_id 
                AND DATE(ch.checkin_time) = ?
            WHERE u.manager_id = ?${employeeFilter}
            GROUP BY u.id, u.name, u.email
            ORDER BY u.name`,
            [date, req.user.id, ...(employee_id ? [employee_id] : [])]
        );

        // Calculate team-level aggregates
        const teamSummary = {
            total_checkins: 0,
            total_hours: 0,
            employees_active: 0,
            unique_clients: new Set()
        };

        const formattedBreakdown = employeeBreakdown.map(emp => {
            const checkins = emp.checkins || 0;
            const hours = emp.total_hours ? parseFloat(emp.total_hours.toFixed(2)) : 0;

            teamSummary.total_checkins += checkins;
            teamSummary.total_hours += hours;
            if (checkins > 0) {
                teamSummary.employees_active++;
            }

            return {
                employee_id: emp.employee_id,
                employee_name: emp.employee_name,
                employee_email: emp.employee_email,
                checkins: checkins,
                clients_visited: emp.clients_visited || 0,
                total_hours: hours,
                avg_distance_km: emp.avg_distance ? parseFloat(emp.avg_distance.toFixed(2)) : null
            };
        });

        // Get unique clients count for the team
        const [clientsResult] = await pool.execute(
            `SELECT COUNT(DISTINCT ch.client_id) as unique_clients
             FROM checkins ch
             INNER JOIN users u ON ch.employee_id = u.id
             WHERE u.manager_id = ? AND DATE(ch.checkin_time) = ?${employeeFilter}`,
            params
        );

        res.json({
            success: true,
            data: {
                date: date,
                team_summary: {
                    total_checkins: teamSummary.total_checkins,
                    total_hours: parseFloat(teamSummary.total_hours.toFixed(2)),
                    employees_active: teamSummary.employees_active,
                    unique_clients: clientsResult[0]?.unique_clients || 0
                },
                employee_breakdown: formattedBreakdown
            }
        });
    } catch (error) {
        console.error('Daily summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate daily summary' });
    }
});

module.exports = router;
