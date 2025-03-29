use anchor_lang::prelude::*;

declare_id!("DVFUmuKfXTmkRW5BMQqx8Xrt1xLdqSrhjBJPRoELaMLU");

#[program]
pub mod favorites {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn set_favorite(ctx: Context<SetFavorite>, color: String, number: u8, name: String) -> Result<()> {
        msg!("Setting favorites...");
        ctx.accounts.favorite.set_inner(Favorite {
            color,
            number,
            name,
        });
        Ok(())
    }

    // pub fn getFavorite(ctx: Context<SetFavorite>) -> Result<()> {
    //     let favorite = &ctx.accounts.favorite;
    //     msg!("Favorite is: {:?}", favorite);
    //     Ok(())
    // }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct SetFavorite<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(init, payer = user, space = 8 + Favorite::INIT_SPACE, seeds = [b"favorites", user.key().as_ref()], bump)]
    pub favorite: Account<'info, Favorite>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Favorite {
    #[max_len(50)]
    color: String,
    number: u8,
    #[max_len(50)]
    name: String
}
