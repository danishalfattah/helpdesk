BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Requester] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(128) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Requester_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Requester_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Requester_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[ThreadEntry] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [authorAgentId] INT,
    [authorRequesterId] INT,
    [isInternal] BIT NOT NULL CONSTRAINT [ThreadEntry_isInternal_df] DEFAULT 0,
    [body] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ThreadEntry_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ThreadEntry_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ThreadEvent] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [agentId] INT,
    [eventType] NVARCHAR(32) NOT NULL,
    [oldValue] NVARCHAR(255),
    [newValue] NVARCHAR(255),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ThreadEvent_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ThreadEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Attachment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [threadEntryId] INT NOT NULL,
    [originalName] NVARCHAR(255) NOT NULL,
    [mimeType] NVARCHAR(128) NOT NULL,
    [size] INT NOT NULL,
    [path] NVARCHAR(500) NOT NULL,
    [checksum] NVARCHAR(64) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Attachment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Attachment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Ticket] (
    [id] INT NOT NULL IDENTITY(1,1),
    [number] INT NOT NULL,
    [subject] NVARCHAR(255) NOT NULL,
    [requesterId] INT NOT NULL,
    [departmentId] INT NOT NULL,
    [categoryId] INT,
    [statusId] INT NOT NULL,
    [priorityId] INT NOT NULL,
    [assigneeId] INT,
    [callType] NVARCHAR(64),
    [closureType] NVARCHAR(64),
    [location] NVARCHAR(128),
    [urgency] NVARCHAR(32),
    [risk] NVARCHAR(32),
    [solution] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ticket_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [closedAt] DATETIME2,
    CONSTRAINT [Ticket_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Ticket_number_key] UNIQUE NONCLUSTERED ([number])
);

-- CreateTable
CREATE TABLE [dbo].[TicketStatus] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(64) NOT NULL,
    [isClosed] BIT NOT NULL CONSTRAINT [TicketStatus_isClosed_df] DEFAULT 0,
    [sortOrder] INT NOT NULL CONSTRAINT [TicketStatus_sortOrder_df] DEFAULT 0,
    CONSTRAINT [TicketStatus_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketStatus_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Priority] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(64) NOT NULL,
    [sortOrder] INT NOT NULL CONSTRAINT [Priority_sortOrder_df] DEFAULT 0,
    CONSTRAINT [Priority_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Priority_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ThreadEntry_ticketId_idx] ON [dbo].[ThreadEntry]([ticketId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ThreadEvent_ticketId_idx] ON [dbo].[ThreadEvent]([ticketId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Attachment_threadEntryId_idx] ON [dbo].[Attachment]([threadEntryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_requesterId_idx] ON [dbo].[Ticket]([requesterId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_departmentId_idx] ON [dbo].[Ticket]([departmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_categoryId_idx] ON [dbo].[Ticket]([categoryId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_statusId_idx] ON [dbo].[Ticket]([statusId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_assigneeId_idx] ON [dbo].[Ticket]([assigneeId]);

-- AddForeignKey
ALTER TABLE [dbo].[ThreadEntry] ADD CONSTRAINT [ThreadEntry_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ThreadEntry] ADD CONSTRAINT [ThreadEntry_authorAgentId_fkey] FOREIGN KEY ([authorAgentId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ThreadEntry] ADD CONSTRAINT [ThreadEntry_authorRequesterId_fkey] FOREIGN KEY ([authorRequesterId]) REFERENCES [dbo].[Requester]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ThreadEvent] ADD CONSTRAINT [ThreadEvent_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ThreadEvent] ADD CONSTRAINT [ThreadEvent_agentId_fkey] FOREIGN KEY ([agentId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [Attachment_threadEntryId_fkey] FOREIGN KEY ([threadEntryId]) REFERENCES [dbo].[ThreadEntry]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_requesterId_fkey] FOREIGN KEY ([requesterId]) REFERENCES [dbo].[Requester]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_statusId_fkey] FOREIGN KEY ([statusId]) REFERENCES [dbo].[TicketStatus]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_priorityId_fkey] FOREIGN KEY ([priorityId]) REFERENCES [dbo].[Priority]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
