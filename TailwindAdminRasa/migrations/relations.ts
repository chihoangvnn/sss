import { relations } from "drizzle-orm/relations";
import { customers, orders, orderItems, products, categories, payments, storefrontConfig, storefrontOrders, industries, chatbotConversations, socialAccounts, scheduledPosts, contentCategories, contentAssets, productReviews, users, themeConfigurations, productLandingPages, facebookConversations, facebookMessages, tiktokShopProducts, tiktokBusinessAccounts, tiktokVideos, tiktokShopOrders } from "./schema";

export const ordersRelations = relations(orders, ({one, many}) => ({
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id]
	}),
	orderItems: many(orderItems),
	payments: many(payments),
}));

export const customersRelations = relations(customers, ({many}) => ({
	orders: many(orders),
	chatbotConversations: many(chatbotConversations),
	productReviews: many(productReviews),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	orderItems: many(orderItems),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	storefrontOrders: many(storefrontOrders),
	productReviews: many(productReviews),
	productLandingPages: many(productLandingPages),
	tiktokShopProducts: many(tiktokShopProducts),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	products: many(products),
	industry: one(industries, {
		fields: [categories.industryId],
		references: [industries.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
}));

export const storefrontOrdersRelations = relations(storefrontOrders, ({one}) => ({
	storefrontConfig: one(storefrontConfig, {
		fields: [storefrontOrders.storefrontConfigId],
		references: [storefrontConfig.id]
	}),
	product: one(products, {
		fields: [storefrontOrders.productId],
		references: [products.id]
	}),
}));

export const storefrontConfigRelations = relations(storefrontConfig, ({many}) => ({
	storefrontOrders: many(storefrontOrders),
}));

export const industriesRelations = relations(industries, ({many}) => ({
	categories: many(categories),
}));

export const chatbotConversationsRelations = relations(chatbotConversations, ({one}) => ({
	customer: one(customers, {
		fields: [chatbotConversations.customerId],
		references: [customers.id]
	}),
}));

export const scheduledPostsRelations = relations(scheduledPosts, ({one}) => ({
	socialAccount: one(socialAccounts, {
		fields: [scheduledPosts.socialAccountId],
		references: [socialAccounts.id]
	}),
}));

export const socialAccountsRelations = relations(socialAccounts, ({many}) => ({
	scheduledPosts: many(scheduledPosts),
}));

export const contentAssetsRelations = relations(contentAssets, ({one}) => ({
	contentCategory: one(contentCategories, {
		fields: [contentAssets.categoryId],
		references: [contentCategories.id]
	}),
}));

export const contentCategoriesRelations = relations(contentCategories, ({many}) => ({
	contentAssets: many(contentAssets),
}));

export const productReviewsRelations = relations(productReviews, ({one}) => ({
	product: one(products, {
		fields: [productReviews.productId],
		references: [products.id]
	}),
	customer: one(customers, {
		fields: [productReviews.customerId],
		references: [customers.id]
	}),
}));

export const themeConfigurationsRelations = relations(themeConfigurations, ({one, many}) => ({
	user: one(users, {
		fields: [themeConfigurations.createdBy],
		references: [users.id]
	}),
	productLandingPages: many(productLandingPages),
}));

export const usersRelations = relations(users, ({many}) => ({
	themeConfigurations: many(themeConfigurations),
}));

export const productLandingPagesRelations = relations(productLandingPages, ({one}) => ({
	product: one(products, {
		fields: [productLandingPages.productId],
		references: [products.id]
	}),
	themeConfiguration: one(themeConfigurations, {
		fields: [productLandingPages.themeConfigId],
		references: [themeConfigurations.id]
	}),
}));

export const facebookMessagesRelations = relations(facebookMessages, ({one}) => ({
	facebookConversation: one(facebookConversations, {
		fields: [facebookMessages.conversationId],
		references: [facebookConversations.id]
	}),
}));

export const facebookConversationsRelations = relations(facebookConversations, ({many}) => ({
	facebookMessages: many(facebookMessages),
}));

export const tiktokShopProductsRelations = relations(tiktokShopProducts, ({one}) => ({
	product: one(products, {
		fields: [tiktokShopProducts.productId],
		references: [products.id]
	}),
	tiktokBusinessAccount: one(tiktokBusinessAccounts, {
		fields: [tiktokShopProducts.businessAccountId],
		references: [tiktokBusinessAccounts.id]
	}),
}));

export const tiktokBusinessAccountsRelations = relations(tiktokBusinessAccounts, ({many}) => ({
	tiktokShopProducts: many(tiktokShopProducts),
	tiktokVideos: many(tiktokVideos),
	tiktokShopOrders: many(tiktokShopOrders),
}));

export const tiktokVideosRelations = relations(tiktokVideos, ({one}) => ({
	tiktokBusinessAccount: one(tiktokBusinessAccounts, {
		fields: [tiktokVideos.businessAccountId],
		references: [tiktokBusinessAccounts.id]
	}),
}));

export const tiktokShopOrdersRelations = relations(tiktokShopOrders, ({one}) => ({
	tiktokBusinessAccount: one(tiktokBusinessAccounts, {
		fields: [tiktokShopOrders.businessAccountId],
		references: [tiktokBusinessAccounts.id]
	}),
}));