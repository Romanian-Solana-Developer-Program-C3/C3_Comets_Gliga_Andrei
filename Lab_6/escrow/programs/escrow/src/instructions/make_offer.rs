//This instructions will make an offer as an escrow account
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked},
    associated_token::AssociatedToken
};
use crate::state::Offer;

#[derive(Accounts)]
#[instruction(maker_amount: u64)]
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = ata.amount >= maker_amount,
        associated_token::mint = token_a_mint,
        associated_token::authority = maker,
    )]
    pub ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = token_a_mint,
        associated_token::authority = offer,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = maker,
        space = Offer::INIT_SPACE,
        seeds = [b"offer", maker.key().as_ref(), token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump,
    )]
    pub offer: Account<'info, Offer>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

}

pub fn handler(ctx: Context<MakeOffer>, token_a_amount: u64, token_b_amount: u64) -> Result<()> {
    // Create the offer object
    ctx.accounts.offer.set_inner(
        Offer {
            maker: ctx.accounts.maker.key(),
            mint_a: ctx.accounts.token_a_mint.key(),
            mint_b: ctx.accounts.token_b_mint.key(),
            amount_a: token_a_amount,
            amount_b: token_b_amount,
        }
    );

    // Transfer funds to vault
    let cpi_accounts = TransferChecked{
        from: ctx.accounts.maker.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.token_a_mint.to_account_info(),
        authority: ctx.accounts.maker.to_account_info().clone(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    transfer_checked(cpi_ctx, token_a_amount, 0)
}