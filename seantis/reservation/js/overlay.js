var reservation_overlay_init = null;

(function($) {

    var popups = null;

    // seantis reservation forms don't do inline validation because it works
    // on a limited amount of cases and returns results in the wrong language
    jQuery.ajaxSetup({
        dataFilter: function (data, type) {
            if (data.indexOf('seantis-reservation-form') > 0) {
                return data.replace(/z3cformInlineValidation/g, '');
            } else {
                return data;
            }
        }
    });

    // Shows portalMessages swallowed by the prepOverlay mechanism
    // on the parent page
    var get_popup_messages = function(soup) {
        // all portal messages are in the same DOM (no iframe), so get the first
        var target = $('dl.portalMessage:first');
        var messages = soup.find('dl.portalMessage');

        // filter out the ones without any text
        messages = _.filter(messages, function(m) {
            return !_.isEmpty($.trim($(m).find('dd').text()));
        });

        if (!messages.length) {
            return {};
        }

        messages = $(messages);

        var show = function() {
            messages.hide();
            target.after(messages);
            messages.fadeIn('slow');
        };
        var hide = function() {
            messages.fadeOut('slow');
            popups = null;
        };

        return {show:show, hide:hide};
    };

    // call with the result of get_popup_messages to show / hide
    var show_popup_messages = function(get_result) {
        if (!get_result) {
            return;
        }

        if (_.isUndefined(get_result.show)) {
            return;
        }

        if (_.isUndefined(get_result.hide)) {
            return;
        }

        setTimeout(get_result.show, 0);
        setTimeout(get_result.hide, 4000);
    };

    var disable_readonly_calendars = function() {
        _.defer(function() {
            $('input[readonly]').siblings('.caltrigger').hide();
        });
    };

    var init_tinymce = function() {
        $('.richtext-field textarea').each(function(index, el) {
            // force tinymce to init again
            var id = $(el).attr('id');

            if (typeof(InitializedTinyMCEInstances) != "undefined") {
                delete InitializedTinyMCEInstances[id];
            }

            if (typeof(TinyMCEConfig) != "undefined") {
                var cfg = new TinyMCEConfig(id);
                cfg.init();
            }
        });
    };

    var on_formload_success = function(e, parent, form) {
        seantis.formgroups.init();
        seantis.wizard.init();

        disable_readonly_calendars();
        init_tinymce();
    };

    var on_formload_failure = function(e, parent, form, status) {
        if (popups) {
            show_popup_messages(popups);
        }

        if (status == 'error') {
            parent.find('div').append(
                [
                    '<dl class="portalMessage error">',
                    '<dt>' + seantis.locale('error') + '</dt>',
                    '<dd>' + seantis.locale('no_connection') + '</dd>',
                    '</dl>'
                ].join('\n')
            );
        }
    };

    reservation_overlay_init = function(elements, options) {
        if (_.isUndefined(options)) {
            options = {config:{}};
        }

        // bind events (ensuring that there's only one handler at a time)
        // -> because there can only be one overlay at any given time
        (function(formload_success, formload_failure) {
            $(document).unbind('seantis.formload_success');
            $(document).unbind('seantis.formload_failure');

            $(document).bind('seantis.formload_success', formload_success);
            $(document).bind('seantis.formload_failure', formload_failure);
        })(on_formload_success, on_formload_failure);

        var before_load = function() {
            seantis.formgroups.init();
            seantis.wizard.init();
            disable_readonly_calendars();
            init_tinymce();
            jQuery = $;

            // some plone javascript mistakenly addes a required class to
            // to the tabs in the resource view after the overlay has been
            // opened - correct that error here:
            _.defer(function() {
                $('.resource-view-switch a').removeClass('required');
            });
        };

        var after_post = function(el) {
            seantis.formgroups.init(el);
            seantis.your_reservations.update();
            popups = get_popup_messages(el);
            $(document).trigger('reservations-changed');

            // z3cform renders views with widget-only errors
            // with an empty field.error div
            // it makes the forms have too much white space, so
            // remove it here
            el.find('div.field.error').each(function(ix, _field) {
                var field = $(_field);
                if (field.children().length === 0) {
                    field.remove();
                }
            });
        };

        var default_options = {
            subtype:          'ajax',
            filter:           common_content_filter,
            formselector:     '.seantis-reservation-form',
            closeselector:    '[name="form.buttons.cancel"]',
            noform:           function(overlay) {
                var replace = overlay.find('#redirect-to-url');

                if (replace.length > 0 && replace.data('url')) {
                    window.location.href = replace.data('url');
                }
                return 'close';
            },
            afterpost:        (function() {}),
            config: {
                onBeforeLoad: (function() {}),
                onClose: (function() {})
            }
        };

        var all_options = _.defaults(options, default_options);
        all_options.config = _.defaults(options.config, default_options.config);

        var _after_post = all_options.afterpost;
        all_options.afterpost = function(el) {
            after_post.apply(this, arguments);
            _after_post.apply(this, arguments);
        };

        var _before_load = all_options.config.onBeforeLoad;
        all_options.config.onBeforeLoad = function() {
            before_load.apply(this, arguments);
            _before_load.apply(this, arguments);
        };

        if (! _.isUndefined(elements.prepOverlay)) {
            elements.prepOverlay(all_options);
        }
    };

    $(document).ready(function() {
        $(document).bind('formOverlayLoadSuccess', function(e, overlay, form, api, pb, ajax_parent) {
            $(document).trigger('seantis.formload_success', [ajax_parent, form]);
        });
        $(document).bind('formOverlayLoadFailure', function(e, overlay, form, api, pb, ajax_parent, noform) {
            $(document).trigger('seantis.formload_failure', [ajax_parent, form, noform]);
        });
    });

})(jQuery);