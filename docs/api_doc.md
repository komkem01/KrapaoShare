package router

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	accountmembers "github.com/komkem01/KrapaoShare-Service/internal/account_members"
	accounttransfers "github.com/komkem01/KrapaoShare-Service/internal/account_transfers"
	"github.com/komkem01/KrapaoShare-Service/internal/accounts"
	auditlogs "github.com/komkem01/KrapaoShare-Service/internal/audit_logs"
	bankconnections "github.com/komkem01/KrapaoShare-Service/internal/bank_connections"
	billparticipants "github.com/komkem01/KrapaoShare-Service/internal/bill_participants"
	"github.com/komkem01/KrapaoShare-Service/internal/bills"
	"github.com/komkem01/KrapaoShare-Service/internal/budgets"
	"github.com/komkem01/KrapaoShare-Service/internal/categories"
	categoryanalytics "github.com/komkem01/KrapaoShare-Service/internal/category_analytics"
	"github.com/komkem01/KrapaoShare-Service/internal/config"
	debtpayments "github.com/komkem01/KrapaoShare-Service/internal/debt_payments"
	"github.com/komkem01/KrapaoShare-Service/internal/debts"
	exchangerates "github.com/komkem01/KrapaoShare-Service/internal/exchange_rates"
	goalcontributions "github.com/komkem01/KrapaoShare-Service/internal/goal_contributions"
	"github.com/komkem01/KrapaoShare-Service/internal/goals"
	"github.com/komkem01/KrapaoShare-Service/internal/http/handlers"
	importedtransactions "github.com/komkem01/KrapaoShare-Service/internal/imported_transactions"
	notificationsettings "github.com/komkem01/KrapaoShare-Service/internal/notification_settings"
	"github.com/komkem01/KrapaoShare-Service/internal/notifications"
	recurringbills "github.com/komkem01/KrapaoShare-Service/internal/recurring_bills"
	sharedgoalmembers "github.com/komkem01/KrapaoShare-Service/internal/shared_goal_members"
	sharedgoals "github.com/komkem01/KrapaoShare-Service/internal/shared_goals"
	systemsettings "github.com/komkem01/KrapaoShare-Service/internal/system_settings"
	"github.com/komkem01/KrapaoShare-Service/internal/transactions"
	"github.com/komkem01/KrapaoShare-Service/internal/types"
	useranalytics "github.com/komkem01/KrapaoShare-Service/internal/user_analytics"
	"github.com/komkem01/KrapaoShare-Service/internal/users"
)

func New(
	logger *slog.Logger,
	health *handlers.HealthHandler,
	userHandler *users.Handler,
	typesHandler *types.Handler,
	exchangeRatesHandler *exchangerates.Handler,
	systemSettingsHandler *systemsettings.Handler,
	categoriesHandler *categories.Handler,
	notificationSettingsHandler *notificationsettings.Handler,
	accountsHandler *accounts.Handler,
	bankConnectionsHandler *bankconnections.Handler,
	accountMembersHandler *accountmembers.Handler,
	accountTransfersHandler *accounttransfers.Handler,
	recurringBillsHandler *recurringbills.Handler,
	billsHandler *bills.Handler,
	billParticipantsHandler *billparticipants.Handler,
	budgetsHandler *budgets.Handler,
	goalsHandler *goals.Handler,
	categoryAnalyticsHandler *categoryanalytics.Handler,
	sharedGoalsHandler *sharedgoals.Handler,
	sharedGoalMembersHandler *sharedgoalmembers.Handler,
	goalContributionsHandler *goalcontributions.Handler,
	debtsHandler *debts.Handler,
	debtPaymentsHandler *debtpayments.Handler,
	transactionsHandler *transactions.Handler,
	importedTransactionsHandler *importedtransactions.Handler,
	notificationsHandler *notifications.Handler,
	userAnalyticsHandler *useranalytics.Handler,
	auditLogsHandler *auditlogs.Handler,
	corsConfig config.CORSConfig,
) http.Handler {
	gin.DebugPrintRouteFunc = func(httpMethod, absolutePath, handlerName string, nuHandlers int) {
		logger.Info("route registered",
			slog.String("method", httpMethod),
			slog.String("path", absolutePath),
			// slog.String("handler", handlerName),
			// slog.Int("middlewares", nuHandlers),
		)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(normalizeAPIPrefix())
	r.Use(requestLogger(logger))
	configureCORS(r, corsConfig)

	r.GET("/healthz", gin.WrapF(health.Health))
	r.GET("/readyz", gin.WrapF(health.Ready))

	api := r.Group("/api/v1")
	api.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	authGroup := api.Group("/auth")
	authGroup.POST("/register", userHandler.Register)
	authGroup.POST("/login", userHandler.Login)
	authGroup.POST("/google", userHandler.GoogleSignIn)
	authGroup.GET("/google/login", userHandler.GoogleOAuthLogin)
	authGroup.GET("/google/callback", userHandler.GoogleOAuthCallback)
	authGroup.GET("/me", userHandler.GetInfo)
	authGroup.POST("/change-password", userHandler.ChangePassword)
	authGroup.POST("/refresh", userHandler.Refresh)
	authGroup.POST("/logout", userHandler.Logout)

	r.GET("/auth/google/login", userHandler.GoogleOAuthLogin)
	r.GET("/auth/google/callback", userHandler.GoogleOAuthCallback)

	usersGroup := api.Group("/users")
	usersGroup.GET("", userHandler.ListUsers)
	usersGroup.POST("", userHandler.CreateUser)
	usersGroup.GET("/:id", userHandler.GetUser)
	usersGroup.PATCH("/:id", userHandler.UpdateUser)
	usersGroup.DELETE("/:id", userHandler.DeleteUser)

	// Types endpoints
	typesGroup := api.Group("/types")
	typesGroup.GET("", typesHandler.List)
	typesGroup.POST("", typesHandler.Create)
	typesGroup.GET("/user/:userId", typesHandler.ListByUser)
	typesGroup.GET("/:id", typesHandler.Get)
	typesGroup.PATCH("/:id", typesHandler.Update)
	typesGroup.DELETE("/:id", typesHandler.Delete)

	// Exchange Rates endpoints
	exchangeRatesGroup := api.Group("/exchange-rates")
	exchangeRatesGroup.GET("", exchangeRatesHandler.List)
	exchangeRatesGroup.POST("", exchangeRatesHandler.Create)
	exchangeRatesGroup.GET("/:id", exchangeRatesHandler.Get)
	exchangeRatesGroup.PATCH("/:id", exchangeRatesHandler.Update)
	exchangeRatesGroup.DELETE("/:id", exchangeRatesHandler.Delete)

	// System Settings endpoints
	systemSettingsGroup := api.Group("/system-settings")
	systemSettingsGroup.GET("", systemSettingsHandler.List)
	systemSettingsGroup.POST("", systemSettingsHandler.Create)
	systemSettingsGroup.GET("/:id", systemSettingsHandler.Get)
	systemSettingsGroup.GET("/user/:userId", systemSettingsHandler.GetByUser)
	systemSettingsGroup.PATCH("/:id", systemSettingsHandler.Update)
	systemSettingsGroup.DELETE("/:id", systemSettingsHandler.Delete)

	// Categories endpoints
	categoriesGroup := api.Group("/categories")
	categoriesGroup.GET("", categoriesHandler.List)
	categoriesGroup.POST("", categoriesHandler.Create)
	categoriesGroup.GET("/user/:userId", categoriesHandler.ListByUser)
	categoriesGroup.GET("/:id", categoriesHandler.Get)
	categoriesGroup.PATCH("/:id", categoriesHandler.Update)
	categoriesGroup.DELETE("/:id", categoriesHandler.Delete)

	// Notification Settings endpoints
	notificationSettingsGroup := api.Group("/notification-settings")
	notificationSettingsGroup.GET("", notificationSettingsHandler.List)
	notificationSettingsGroup.POST("", notificationSettingsHandler.Create)
	notificationSettingsGroup.GET("/:id", notificationSettingsHandler.Get)
	notificationSettingsGroup.PATCH("/:id", notificationSettingsHandler.Update)
	notificationSettingsGroup.DELETE("/:id", notificationSettingsHandler.Delete)

	// Accounts endpoints
	accountsGroup := api.Group("/accounts")
	accountsGroup.GET("", accountsHandler.List)
	accountsGroup.POST("", accountsHandler.Create)
	accountsGroup.GET("/:id", accountsHandler.Get)
	accountsGroup.PATCH("/:id", accountsHandler.Update)
	accountsGroup.DELETE("/:id", accountsHandler.Delete)
	accountsGroup.GET("/user/:userId", accountsHandler.GetByUser)
	accountsGroup.GET("/share/:shareCode", accountsHandler.GetByShareCode)
	accountsGroup.PATCH("/:id/balance", accountsHandler.UpdateBalance)

	// Account Members endpoints
	accountMembersGroup := api.Group("/account-members")
	accountMembersGroup.GET("", accountMembersHandler.List)
	accountMembersGroup.POST("", accountMembersHandler.Create)
	accountMembersGroup.GET("/:id", accountMembersHandler.Get)
	accountMembersGroup.PATCH("/:id", accountMembersHandler.Update)
	accountMembersGroup.DELETE("/:id", accountMembersHandler.Delete)
	accountMembersGroup.GET("/account/:accountId", accountMembersHandler.GetByAccount)
	accountMembersGroup.GET("/user/:userId", accountMembersHandler.GetByUser)
	accountMembersGroup.GET("/account/:accountId/user/:userId", accountMembersHandler.GetByAccountAndUser)

	// Account Transfers endpoints
	accountTransfersGroup := api.Group("/account-transfers")
	accountTransfersGroup.GET("", accountTransfersHandler.List)
	accountTransfersGroup.POST("", accountTransfersHandler.Create)
	// Bank Connections endpoints
	bankConnectionsGroup := api.Group("/bank-connections")
	bankConnectionsGroup.GET("", bankConnectionsHandler.List)
	bankConnectionsGroup.POST("", bankConnectionsHandler.Create)
	bankConnectionsGroup.GET("/:id", bankConnectionsHandler.Get)
	bankConnectionsGroup.PATCH("/:id", bankConnectionsHandler.Update)
	bankConnectionsGroup.DELETE("/:id", bankConnectionsHandler.Delete)

	accountTransfersGroup.GET("/:id", accountTransfersHandler.Get)
	accountTransfersGroup.PATCH("/:id", accountTransfersHandler.Update)
	accountTransfersGroup.DELETE("/:id", accountTransfersHandler.Delete)

	// Recurring Bills endpoints
	recurringBillsGroup := api.Group("/recurring-bills")
	recurringBillsGroup.GET("", recurringBillsHandler.List)
	recurringBillsGroup.POST("", recurringBillsHandler.Create)
	recurringBillsGroup.GET("/:id", recurringBillsHandler.Get)
	recurringBillsGroup.PATCH("/:id", recurringBillsHandler.Update)
	recurringBillsGroup.DELETE("/:id", recurringBillsHandler.Delete)

	// Bills endpoints
	billsGroup := api.Group("/bills")
	billsGroup.GET("", billsHandler.List)
	billsGroup.POST("", billsHandler.Create)
	billsGroup.GET("/:id", billsHandler.Get)
	billsGroup.PATCH("/:id", billsHandler.Update)
	billsGroup.DELETE("/:id", billsHandler.Delete)

	// Bill Participants endpoints
	billParticipantsGroup := api.Group("/bill-participants")
	billParticipantsGroup.GET("", billParticipantsHandler.List)
	billParticipantsGroup.POST("", billParticipantsHandler.Create)
	billParticipantsGroup.GET("/:id", billParticipantsHandler.Get)
	billParticipantsGroup.PATCH("/:id", billParticipantsHandler.Update)
	billParticipantsGroup.DELETE("/:id", billParticipantsHandler.Delete)
	billParticipantsGroup.GET("/bill/:billId", billParticipantsHandler.ListByBill)
	billParticipantsGroup.GET("/user/:userId", billParticipantsHandler.ListByUser)

	// Budgets endpoints
	budgetsGroup := api.Group("/budgets")
	budgetsGroup.GET("", budgetsHandler.List)
	budgetsGroup.POST("", budgetsHandler.Create)
	budgetsGroup.GET("/:id", budgetsHandler.Get)
	budgetsGroup.PATCH("/:id", budgetsHandler.Update)
	budgetsGroup.DELETE("/:id", budgetsHandler.Delete)

	// Goals endpoints
	goalsGroup := api.Group("/goals")
	goalsGroup.GET("", goalsHandler.List)
	goalsGroup.POST("", goalsHandler.Create)
	goalsGroup.GET("/:id", goalsHandler.Get)
	goalsGroup.PATCH("/:id", goalsHandler.Update)
	goalsGroup.DELETE("/:id", goalsHandler.Delete)

	// Shared Goals endpoints
	sharedGoalsGroup := api.Group("/shared-goals")
	sharedGoalsGroup.GET("", sharedGoalsHandler.List)
	sharedGoalsGroup.POST("", sharedGoalsHandler.Create)
	sharedGoalsGroup.GET("/:id", sharedGoalsHandler.Get)
	sharedGoalsGroup.PATCH("/:id", sharedGoalsHandler.Update)
	sharedGoalsGroup.DELETE("/:id", sharedGoalsHandler.Delete)

	// Shared Goal Members endpoints
	sharedGoalMembersGroup := api.Group("/shared-goal-members")
	sharedGoalMembersGroup.GET("", sharedGoalMembersHandler.List)
	sharedGoalMembersGroup.POST("", sharedGoalMembersHandler.Create)
	sharedGoalMembersGroup.GET("/:id", sharedGoalMembersHandler.Get)
	sharedGoalMembersGroup.PATCH("/:id", sharedGoalMembersHandler.Update)
	sharedGoalMembersGroup.DELETE("/:id", sharedGoalMembersHandler.Delete)
	sharedGoalMembersGroup.GET("/goal/:goalId", sharedGoalMembersHandler.ListBySharedGoal)
	sharedGoalMembersGroup.GET("/user/:userId", sharedGoalMembersHandler.ListByUser)
	sharedGoalMembersGroup.GET("/goal/:goalId/user/:userId", sharedGoalMembersHandler.GetBySharedGoalAndUser)

	// Goal Contributions endpoints
	goalContributionsGroup := api.Group("/goal-contributions")
	goalContributionsGroup.GET("", goalContributionsHandler.List)
	goalContributionsGroup.POST("", goalContributionsHandler.Create)
	goalContributionsGroup.GET("/:id", goalContributionsHandler.Get)
	goalContributionsGroup.PATCH("/:id", goalContributionsHandler.Update)
	goalContributionsGroup.DELETE("/:id", goalContributionsHandler.Delete)
	goalContributionsGroup.GET("/goal/:goalId", goalContributionsHandler.ListBySharedGoal)
	goalContributionsGroup.GET("/user/:userId", goalContributionsHandler.ListByUser)

	// Debts endpoints
	debtsGroup := api.Group("/debts")
	debtsGroup.GET("", debtsHandler.List)
	debtsGroup.POST("", debtsHandler.Create)
	debtsGroup.GET("/:id", debtsHandler.Get)
	debtsGroup.PATCH("/:id", debtsHandler.Update)
	debtsGroup.DELETE("/:id", debtsHandler.Delete)
	debtsGroup.GET("/creditor/:userId", debtsHandler.ListByCreditor)
	debtsGroup.GET("/debtor/:userId", debtsHandler.ListByDebtor)

	// Debt Payments endpoints
	debtPaymentsGroup := api.Group("/debt-payments")
	debtPaymentsGroup.GET("", debtPaymentsHandler.List)
	debtPaymentsGroup.POST("", debtPaymentsHandler.Create)
	debtPaymentsGroup.GET("/:id", debtPaymentsHandler.Get)
	debtPaymentsGroup.PATCH("/:id", debtPaymentsHandler.Update)
	debtPaymentsGroup.DELETE("/:id", debtPaymentsHandler.Delete)
	debtPaymentsGroup.GET("/debt/:debtId", debtPaymentsHandler.ListByDebt)
	debtPaymentsGroup.GET("/user/:userId", debtPaymentsHandler.ListByUser)

	// Transactions endpoints
	transactionsGroup := api.Group("/transactions")
	transactionsGroup.GET("", transactionsHandler.List)
	transactionsGroup.POST("", transactionsHandler.Create)
	transactionsGroup.GET("/:id", transactionsHandler.Get)
	transactionsGroup.PATCH("/:id", transactionsHandler.Update)
	transactionsGroup.DELETE("/:id", transactionsHandler.Delete)
	transactionsGroup.GET("/user/:userId", transactionsHandler.ListByUser)
	transactionsGroup.GET("/account/:accountId", transactionsHandler.ListByAccount)

	// Imported Transactions endpoints
	importedTransactionsGroup := api.Group("/imported-transactions")
	importedTransactionsGroup.GET("", importedTransactionsHandler.List)
	importedTransactionsGroup.POST("", importedTransactionsHandler.Create)
	importedTransactionsGroup.GET("/:id", importedTransactionsHandler.Get)
	importedTransactionsGroup.PATCH("/:id", importedTransactionsHandler.Update)
	importedTransactionsGroup.DELETE("/:id", importedTransactionsHandler.Delete)

	// Notifications endpoints
	notificationsGroup := api.Group("/notifications")
	notificationsGroup.GET("", notificationsHandler.List)
	notificationsGroup.POST("", notificationsHandler.Create)
	notificationsGroup.GET("/:id", notificationsHandler.Get)
	notificationsGroup.PATCH("/:id", notificationsHandler.Update)
	notificationsGroup.DELETE("/:id", notificationsHandler.Delete)
	notificationsGroup.GET("/user/:userId", notificationsHandler.ListByUser)
	notificationsGroup.GET("/user/:userId/unread", notificationsHandler.ListUnreadByUser)
	notificationsGroup.POST("/:id/read", notificationsHandler.MarkAsRead)
	notificationsGroup.POST("/:id/unread", notificationsHandler.MarkAsUnread)
	notificationsGroup.POST("/user/:userId/read-all", notificationsHandler.MarkAllAsRead)

	// User Analytics endpoints
	userAnalyticsGroup := api.Group("/user-analytics")
	userAnalyticsGroup.GET("", userAnalyticsHandler.List)
	userAnalyticsGroup.POST("", userAnalyticsHandler.Create)
	userAnalyticsGroup.GET("/:id", userAnalyticsHandler.Get)
	userAnalyticsGroup.PATCH("/:id", userAnalyticsHandler.Update)
	userAnalyticsGroup.DELETE("/:id", userAnalyticsHandler.Delete)

	// Category Analytics endpoints
	categoryAnalyticsGroup := api.Group("/category-analytics")
	categoryAnalyticsGroup.GET("", categoryAnalyticsHandler.List)
	categoryAnalyticsGroup.POST("", categoryAnalyticsHandler.Create)
	categoryAnalyticsGroup.GET("/:id", categoryAnalyticsHandler.Get)
	categoryAnalyticsGroup.PATCH("/:id", categoryAnalyticsHandler.Update)
	categoryAnalyticsGroup.DELETE("/:id", categoryAnalyticsHandler.Delete)

	// Audit Logs endpoints
	auditLogsGroup := api.Group("/audit-logs")
	auditLogsGroup.GET("", auditLogsHandler.List)
	auditLogsGroup.POST("", auditLogsHandler.Create)
	auditLogsGroup.GET("/:id", auditLogsHandler.Get)
	auditLogsGroup.PATCH("/:id", auditLogsHandler.Update)
	auditLogsGroup.DELETE("/:id", auditLogsHandler.Delete)

	return r
}

func requestLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		logger.Info("http request",
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.Int("status", status),
			slog.Duration("latency", latency),
			slog.String("client_ip", c.ClientIP()),
		)
	}
}

func normalizeAPIPrefix() gin.HandlerFunc {
	return func(c *gin.Context) {
		const duplicatePrefix = "/api/v1/api/v1"
		if strings.HasPrefix(c.Request.URL.Path, duplicatePrefix) {
			c.Request.URL.Path = strings.TrimPrefix(c.Request.URL.Path, "/api/v1")
		}
		c.Next()
	}
}

func configureCORS(r *gin.Engine, cfg config.CORSConfig) {
	c := cors.DefaultConfig()
	if len(cfg.AllowedOrigins) == 0 {
		c.AllowAllOrigins = true
	} else {
		c.AllowOrigins = cfg.AllowedOrigins
	}
	if len(cfg.AllowedMethods) > 0 {
		c.AllowMethods = cfg.AllowedMethods
	}
	if len(cfg.AllowedHeaders) > 0 {
		c.AllowHeaders = cfg.AllowedHeaders
	}
	c.AllowCredentials = cfg.AllowCredentials
	r.Use(cors.New(c))
}
