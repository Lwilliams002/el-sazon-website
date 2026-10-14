<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Frontend rules
- Define customer-facing colors and typography in `src/styles.css` semantic tokens so home and ordering pages stay consistent.
- Use the shared Button component for customer actions and keep restaurant photos as bundled imports for local portability.
- Keep presentation changes separate from order submission and payment integrations to avoid disrupting checkout.
